#!/usr/bin/env node
// Builds what the developer asked for, one thing at a time, and suggests what could
// come next. Nothing else is built.
//
//   node steps.mjs <project>                        what was asked, what is done, ideas
//   node steps.mjs <project> ok                     the developer checked the last one
//   node steps.mjs <project> build layout           build one thing
//   node steps.mjs <project> build feature:orders --fields "customer:text!, total:currency!"
//   node steps.mjs <project> add dashboard login    remember for later, do not build
//   node steps.mjs <project> next                   build the next thing that was asked
//   node steps.mjs <project> drop dashboard         they do not want it any more
//   node steps.mjs <project> complete               copy what the code imports but lacks
//   node steps.mjs <project> list                   everything that can be built
//
// Names: layout, basics, forms, helpers, table, api, speed, the parts of
// frontend-blocks, feature:<name>, or one component, hook or util (toast, DatePicker).

import path from 'node:path';
import { parseArgs } from 'node:util';
import { blockList, buildStep, fail, findStep, finish, loadState, saveState, stepInfo, STEPS } from './lib/project.mjs';
import { suggest } from './lib/suggest.mjs';

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: { fields: { type: 'string' }, singular: { type: 'string' }, 'no-install': { type: 'boolean', default: false } },
  });
} catch (error) {
  fail(error.message);
}
const { values: opt, positionals } = parsed;
const [folder, command, ...names] = positionals;
if (!folder) fail('Usage: node steps.mjs <project> [ok | build <name> | add <names> | next | drop <name> | complete | list]');
const project = path.resolve(folder);
const state = loadState(project);
if (!state) fail(`${project} has no docs/steps.json. Start with create.mjs; for an existing project use add-to-project.mjs.`);
const installPackages = !opt['no-install'];

const waiting = () => state.steps.filter((s) => s.state === 'built');
const next = () => state.steps.find((s) => s.state === 'todo');
const meaning = (word) => findStep(word) ?? fail(`"${word}" is not known. See: steps.mjs ${folder} list`);

function ideas() {
  const asked = state.steps.filter((s) => s.state === 'todo');
  if (asked.length) {
    console.log('Asked for, not built yet:');
    for (const s of asked) console.log(`  - ${stepInfo(s.id).title}`);
  }
  const list = suggest(project, { planned: state.steps.map((s) => s.id) });
  if (list.length) {
    console.log('Ideas for the next step (build nothing of this without their yes):');
    for (const { say, why } of list) console.log(`  - "${say}" (${why})`);
  }
}

function report(step, { notes = [], todo = [] } = {}) {
  console.log(`Built: ${stepInfo(step.id).title}`);
  for (const note of notes.slice(0, 8)) console.log(`  note: ${note}`);
  for (const line of todo) console.log(`  to do: ${line}`);
  console.log('Developer, please check:');
  for (const line of stepInfo(step.id).check) console.log(`  - ${line}`);
  ideas();
  console.log('AI: run scripts/verify.mjs --fast. Then show the check list and 2 to 4 ideas, ask what they want next, and STOP.');
}

function build(id) {
  let step = state.steps.find((s) => s.id === id);
  if (step && step.state !== 'todo') fail(`${stepInfo(id).title} is already built.`);
  if (id.startsWith('feature:') && !opt.fields) {
    fail(`Ask the developer for the fields of ${id.slice(8)}, then: steps.mjs ${folder} build ${id} --fields "name:text!, status:select(open|done)"`);
  }
  if (!step) state.steps.push((step = { id, state: 'todo' }));
  const result = buildStep(project, state, id, { installPackages, fields: opt.fields, singular: opt.singular });
  step.state = 'built';
  saveState(project, state);
  report(step, result);
}

switch (command) {
  case undefined: {
    const mark = { todo: ' ', built: '~', ok: 'x' };
    for (const s of state.steps) console.log(`[${mark[s.state]}] ${stepInfo(s.id).title}`);
    ideas();
    break;
  }
  case 'ok': {
    if (!waiting().length) fail('Nothing is waiting for a check.');
    for (const s of waiting()) {
      s.state = 'ok';
      console.log(`Checked: ${stepInfo(s.id).title}`);
    }
    saveState(project, state);
    ideas();
    break;
  }
  case 'build': {
    if (names.length !== 1) fail('One thing at a time: build <name>. Use "add" to remember others.');
    build(meaning(names[0]));
    break;
  }
  case 'next': {
    if (waiting().length) fail(`${stepInfo(waiting()[0].id).title} was not checked yet. Ask the developer; after their OK: steps.mjs ${folder} ok`);
    const step = next();
    if (!step) {
      console.log('Everything they asked for is built.');
      ideas();
    } else build(step.id);
    break;
  }
  case 'add': {
    if (!names.length) fail('add what?');
    for (const id of names.map(meaning)) {
      if (!state.steps.some((s) => s.id === id)) state.steps.push({ id, state: 'todo' });
      console.log(`Remembered: ${stepInfo(id).title}`);
    }
    saveState(project, state);
    break;
  }
  case 'drop': {
    for (const id of names.map(meaning)) {
      const step = state.steps.find((s) => s.id === id);
      if (!step) fail(`${stepInfo(id).title} was not asked for.`);
      if (step.state !== 'todo') fail(`${stepInfo(id).title} is already built. Removing code is a change: ask what should go.`);
      state.steps.splice(state.steps.indexOf(step), 1);
      console.log(`Dropped: ${stepInfo(id).title}`);
    }
    saveState(project, state);
    break;
  }
  case 'complete': {
    const { added, notes, todo } = finish(project, state, { installPackages });
    saveState(project, state);
    console.log(`${added} files copied.`);
    for (const line of [...notes.slice(0, 5), ...todo]) console.log(`  ${line}`);
    break;
  }
  case 'list':
    console.log(`Steps: ${Object.entries(STEPS).map(([id, s]) => `${id} (${s.title})`).join(', ')}`);
    console.log('Parts:');
    for (const [id, about] of blockList()) console.log(`  ${id}: ${about}`);
    console.log('Also: feature:<name> with --fields, or one component, hook or util, e.g. toast, modal, DatePicker, useClipboard.');
    break;
  default:
    fail(`Unknown command "${command}".`);
}
