#!/usr/bin/env node
// Builds a project in small steps. After each one the developer checks it.
//
//   node steps.mjs <project>                 what is done, what comes next
//   node steps.mjs <project> next            build the next step
//   node steps.mjs <project> ok              the developer checked it
//   node steps.mjs <project> ok next         both
//   node steps.mjs <project> skip            leave the next step out
//   node steps.mjs <project> add charts      plan a ready part, or  add feature:orders
//   node steps.mjs <project> built feature:orders   a feature was generated

import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildStep, expandBlocks, fail, loadState, saveState, stepInfo, STEPS } from './lib/project.mjs';

const [folder, ...commands] = process.argv.slice(2);
if (!folder) fail('Usage: node steps.mjs <project> [next | ok | skip | add <name> | built <step>]');
const project = path.resolve(folder);
const state = loadState(project);
if (!state) fail(`${project} has no docs/steps.json. Start with create.mjs; for an existing project use add-to-project.mjs.`);

const noInstall = commands.includes('--no-install');
const words = commands.filter((c) => !c.startsWith('--'));
const waiting = () => state.steps.find((s) => s.state === 'built');
const next = () => state.steps.find((s) => s.state === 'todo');
const number = (step) => `${state.steps.indexOf(step) + 1} of ${state.steps.length}`;

/** What the developer should look at, and the sign for the AI to stop. */
export function tellCheck(step, { notes = [], todo = [] } = {}) {
  const info = stepInfo(step.id);
  console.log(`Step ${number(step)} is built: ${info.title}`);
  for (const note of notes.slice(0, 8)) console.log(`  note: ${note}`);
  for (const line of todo) console.log(`  to do: ${line}`);
  console.log('Developer, please check:');
  for (const line of info.check) console.log(`  - ${line}`);
  const after = state.steps.find((s) => s.state === 'todo');
  console.log(after ? `Next would be: ${stepInfo(after.id).title}` : 'This was the last step.');
  console.log('AI: run scripts/verify.mjs --fast, show this list, ask "OK, change something, or skip the next?" and STOP.');
}

if (!words.length) {
  const mark = { todo: ' ', built: '~', ok: 'x', skipped: '-' };
  for (const step of state.steps) console.log(`[${mark[step.state]}] ${stepInfo(step.id).title}`);
  if (waiting()) tellCheck(waiting());
  else console.log(next() ? `Next: ${stepInfo(next().id).title}` : 'All steps are done.');
}

for (let i = 0; i < words.length; i++) {
  const word = words[i];
  if (word === 'ok') {
    const step = waiting();
    if (!step) fail('Nothing is waiting for a check.');
    step.state = 'ok';
    saveState(project, state);
    console.log(`Checked: ${stepInfo(step.id).title}`);
  } else if (word === 'next') {
    if (waiting()) fail(`Step ${number(waiting())} (${stepInfo(waiting().id).title}) was not checked yet. Ask the developer; after their OK run: steps.mjs ${folder} ok next`);
    const step = next();
    if (!step) {
      console.log('All steps are done. Add more with: steps.mjs <project> add <part> or add feature:<name>');
      break;
    }
    const [kind, name] = step.id.split(':');
    if (kind === 'feature' && !existsSync(path.join(project, 'src/features', name))) {
      console.log(`Next step ${number(step)}: feature ${name}.`);
      console.log('AI: ask the developer for its fields and rules, then in the project run');
      console.log(`  node scripts/generate.mjs feature ${name} --fields "…"`);
      console.log(`and after adapting it: steps.mjs ${folder} built feature:${name}`);
      break;
    }
    const result = buildStep(project, state, step.id, { installPackages: !noInstall });
    step.state = 'built';
    saveState(project, state);
    tellCheck(step, result);
  } else if (word === 'built') {
    const id = words[++i];
    const step = state.steps.find((s) => s.id === id);
    if (!step) fail(`No step ${id}. Plan it first: steps.mjs ${folder} add ${id}`);
    if (id.startsWith('feature:') && !existsSync(path.join(project, 'src/features', id.split(':')[1]))) fail(`src/features/${id.split(':')[1]} does not exist yet.`);
    step.state = 'built';
    saveState(project, state);
    tellCheck(step);
  } else if (word === 'skip') {
    const step = next();
    if (!step) fail('There is no next step.');
    if (step.id === 'setup' || step.id === 'layout') fail(`${stepInfo(step.id).title} cannot be left out.`);
    step.state = 'skipped';
    saveState(project, state);
    console.log(`Skipped: ${stepInfo(step.id).title}`);
  } else if (word === 'add') {
    const name = words[++i];
    if (!name) fail('add what? For example: add charts, add feature:orders');
    const ids = name.startsWith('feature:') ? [name] : STEPS[name] ? [name] : [`block:${expandBlocks([name]).at(-1)}`];
    for (const id of ids) {
      const there = state.steps.find((s) => s.id === id);
      if (there?.state === 'skipped') there.state = 'todo';
      else if (!there) state.steps.push({ id, state: 'todo' });
    }
    saveState(project, state);
    console.log(`Planned: ${ids.map((id) => stepInfo(id).title).join(', ')}`);
  } else fail(`Unknown command "${word}".`);
}
