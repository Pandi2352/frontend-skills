#!/usr/bin/env node
// Starts a project: the setup, and the layout if they asked for it first. Everything else
// is built by steps.mjs when the developer asks for it.
//
//   node create.mjs <folder> [options]
//
//   --title "My app"       name in the menu and browser tab
//   --color "#2563eb"      main color; its other shades are calculated
//   --layout navbar        navbar instead of sidebar, when a layout is built
//   --ask a,b              what they asked for, in order; built later one by one:
//                          layout, forms, table, dashboard, login, feature:orders, ...
//   --locale en-IN --currency INR --country IN
//   --all                  build everything in --ask now (without it: all basic steps)
//   --no-install           only write files

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildStep, fail, findStep, saveState, sibling, stepInfo } from './lib/project.mjs';
import { suggest } from './lib/suggest.mjs';

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      color: { type: 'string', default: '#2563eb' },
      layout: { type: 'string', default: 'sidebar' },
      ask: { type: 'string', default: '' },
      locale: { type: 'string', default: 'en-US' },
      currency: { type: 'string', default: 'USD' },
      country: { type: 'string', default: 'US' },
      'no-install': { type: 'boolean', default: false },
      all: { type: 'boolean', default: false },
    },
  });
} catch (error) {
  fail(`${error.message}\nSee the first lines of create.mjs for the options.`);
}
const { values: opt, positionals } = parsed;
const folder = positionals[0];
if (!folder) fail('Usage: node create.mjs <folder> [--title "My app"] [--color "#2563eb"] [--ask layout,dashboard,feature:orders]');
const project = path.resolve(folder);
if (existsSync(project) && readdirSync(project).some((f) => f !== '.git')) fail(`${project} is not empty. Use add-to-project.mjs for an existing project.`);
if (!/^#[\da-f]{6}$/i.test(opt.color)) fail('--color must look like #2563eb');
if (!['sidebar', 'navbar'].includes(opt.layout)) fail('--layout is sidebar or navbar');
const absent = ['frontend-performance', 'frontend-api', 'frontend-blocks'].filter((n) => !existsSync(sibling(n)));
if (absent.length) fail(`Missing next to frontend-core: ${absent.join(', ')}. Install all skills.`);

const words = opt.ask.split(',').map((t) => t.trim()).filter(Boolean);
if (opt.all && !words.length) words.push('layout', 'basics', 'forms', 'helpers', 'table', 'api', 'speed');
const asked = [...new Set(words.map((w) => findStep(w) ?? fail(`"${w}" is not known. See steps.mjs <project> list`)))].filter((id) => id !== 'setup');

const name = path.basename(project).toLowerCase().replace(/[^a-z\d-]+/g, '-').replace(/^-+|-+$/g, '') || 'app';
const state = {
  options: {
    name, title: opt.title ?? name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), color: opt.color, layout: opt.layout,
    locale: opt.locale, currency: opt.currency, country: opt.country, dark: asked.includes('block:dark-mode'),
  },
  hashes: {},
  steps: ['setup', ...asked].map((id) => ({ id, state: 'todo' })),
};
const installPackages = !opt['no-install'];
mkdirSync(project, { recursive: true });

const notes = [];
const todo = [];
// Setup alone shows almost nothing, so a layout they asked for first comes with it.
const now = opt.all ? state.steps.filter((s) => !s.id.startsWith('feature:')) : state.steps.slice(0, asked[0] === 'layout' ? 2 : 1);
for (const step of now) {
  // Packages once, at the end.
  const result = buildStep(project, state, step.id, { installPackages: installPackages && step === now.at(-1) });
  notes.push(...result.notes);
  todo.push(...result.todo);
  step.state = 'built';
}
saveState(project, state);

console.log(`Created ${project}: ${now.map((s) => stepInfo(s.id).title.split(':')[0] === 'Part' ? s.id.split(':')[1] : s.id).join(', ')}`);
for (const note of [...new Set(notes)].slice(0, 10)) console.log(`  note: ${note}`);
for (const line of todo) console.log(`  to do: ${line}`);
const later = state.steps.filter((s) => s.state === 'todo');
if (later.length) {
  console.log('Asked for, built next one by one:');
  for (const s of later) console.log(`  - ${stepInfo(s.id).title}`);
} else {
  const ideas = suggest(project, { planned: state.steps.map((s) => s.id), max: 3 });
  console.log('Ideas for the next step (build nothing of this without their yes):');
  for (const { say, why } of ideas) console.log(`  - "${say}" (${why})`);
}
console.log('Developer, please check:');
for (const line of now.flatMap((s) => stepInfo(s.id).check).slice(0, 8)) console.log(`  - ${line}`);
console.log(`AI: show this in a few lines, ask, and STOP. After their OK: steps.mjs ${folder} ok${later.length ? ', then next' : ', then build what they want'}`);
