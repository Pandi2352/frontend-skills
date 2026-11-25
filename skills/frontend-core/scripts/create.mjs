#!/usr/bin/env node
// Starts a project. It builds only the first step; steps.mjs builds the others, one
// after the other, each after the developer checked the one before.
//
//   node create.mjs <folder> [options]
//
//   --title "My app"       name in the sidebar and browser tab
//   --color "#2563eb"      main color; its other shades are calculated
//   --dark                 light and dark theme
//   --layout sidebar       sidebar (default) or navbar
//   --blocks a,b           ready parts from frontend-blocks, e.g. dashboard,auth-pages
//   --features a,b         features to plan, e.g. orders,customers
//   --locale en-IN --currency INR --country IN
//   --no-api               without API client, login state and TanStack Query
//   --all                  build every step at once, without stopping
//   --no-install           only write files

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildStep, fail, planSteps, saveState, sibling, stepInfo } from './lib/project.mjs';

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      color: { type: 'string', default: '#2563eb' },
      dark: { type: 'boolean', default: false },
      layout: { type: 'string', default: 'sidebar' },
      blocks: { type: 'string', default: '' },
      features: { type: 'string', default: '' },
      locale: { type: 'string', default: 'en-US' },
      currency: { type: 'string', default: 'USD' },
      country: { type: 'string', default: 'US' },
      'no-api': { type: 'boolean', default: false },
      'no-install': { type: 'boolean', default: false },
      all: { type: 'boolean', default: false },
    },
  });
} catch (error) {
  fail(`${error.message}\nSee the first lines of create.mjs for the options.`);
}
const { values: opt, positionals } = parsed;
const folder = positionals[0];
if (!folder) fail('Usage: node create.mjs <folder> [--title "My app"] [--color "#2563eb"] [--dark] [--blocks dashboard,auth-pages] [--features orders]');
const project = path.resolve(folder);
if (existsSync(project) && readdirSync(project).some((f) => f !== '.git')) fail(`${project} is not empty. Use add-to-project.mjs for an existing project.`);
if (!/^#[\da-f]{6}$/i.test(opt.color)) fail('--color must look like #2563eb');
if (!['sidebar', 'navbar'].includes(opt.layout)) fail('--layout is sidebar or navbar');

const list = (text) => text.split(',').map((t) => t.trim()).filter(Boolean);
const api = !opt['no-api'];
const blocks = list(opt.blocks);
if (opt.dark && !blocks.includes('dark-mode')) blocks.unshift('dark-mode');
const features = list(opt.features).map((f) => f.toLowerCase().replace(/[^a-z\d]+/g, '-'));
const absent = ['frontend-performance', ...(api ? ['frontend-api'] : []), ...(blocks.length ? ['frontend-blocks'] : [])].filter((n) => !existsSync(sibling(n)));
if (absent.length) fail(`Missing next to frontend-core: ${absent.join(', ')}. Install all skills.`);
if (features.length && !api) fail('Features need the API code. Leave out --no-api.');

const name = path.basename(project).toLowerCase().replace(/[^a-z\d-]+/g, '-').replace(/^-+|-+$/g, '') || 'app';
const options = {
  name, title: opt.title ?? name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), color: opt.color, layout: opt.layout,
  locale: opt.locale, currency: opt.currency, country: opt.country, api, blocks, features,
};
const state = { options, hashes: {}, steps: planSteps(options) };
const installPackages = !opt['no-install'];
mkdirSync(project, { recursive: true });

const notes = [];
const todo = [];
for (const step of state.steps) {
  if (step.id.startsWith('feature:')) break;
  // Packages once, at the end, when everything is built at once.
  const result = buildStep(project, state, step.id, { installPackages: installPackages && (!opt.all || step === state.steps.filter((s) => !s.id.startsWith('feature:')).at(-1)) });
  notes.push(...result.notes);
  todo.push(...result.todo);
  step.state = opt.all ? 'ok' : 'built';
  if (!opt.all) break;
}
saveState(project, state);

console.log(`Created ${project}`);
for (const note of [...new Set(notes)].slice(0, 10)) console.log(`  note: ${note}`);
for (const line of todo) console.log(`  to do: ${line}`);
if (opt.all) {
  console.log('Every step is built. Next: npm run verify, then npm run dev');
  if (api) console.log('Set VITE_API_URL in .env and check each *.service.ts against the real server.');
} else {
  console.log('Plan:');
  state.steps.forEach((s, i) => console.log(`  ${i + 1}. ${stepInfo(s.id).title}${s.state === 'built' ? '   <- built, please check' : ''}`));
  console.log('Developer, please check:');
  for (const line of stepInfo('setup').check) console.log(`  - ${line}`);
  console.log('AI: show the plan and this list, ask "OK, or change the plan?" and STOP. After the OK: steps.mjs <project> ok next');
}
