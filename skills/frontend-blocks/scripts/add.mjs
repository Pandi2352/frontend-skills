#!/usr/bin/env node
// Copies finished blocks into a project, together with the blocks they need.
// Never overwrites a file.
//
//   node add.mjs --list
//   node add.mjs <project> charts kanban

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const assets = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets');
const blocks = JSON.parse(readFileSync(path.join(assets, 'blocks.json'), 'utf8'));
const [first, ...names] = process.argv.slice(2);

if (!first || first === '--list') {
  for (const [name, b] of Object.entries(blocks)) console.log(`${name.padEnd(16)} ${b.about}${b.blocks ? ` (with ${b.blocks.join(', ')})` : ''}`);
  process.exit(first ? 0 : 2);
}
const project = path.resolve(first);
const src = path.join(project, 'src');
if (!existsSync(src)) {
  console.error(`No src folder in ${project}. Usage: node add.mjs <project> <block ...>`);
  process.exit(2);
}
const unknown = names.filter((n) => !Object.hasOwn(blocks, n));
if (!names.length || unknown.length) {
  console.error(unknown.length ? `Unknown: ${unknown.join(', ')}. See node add.mjs --list` : 'Name at least one block. See node add.mjs --list');
  process.exit(2);
}

// What the blocks are built on, and where it comes from.
const NEEDS = {
  card: ['components/ui/card/index.ts', 'frontend-core'],
  tabs: ['components/ui/tabs/index.ts', 'frontend-core'],
  stepper: ['hooks/useStepper.ts', 'frontend-core'],
  'stable-callback': ['hooks/useStableCallback.ts', 'frontend-core'],
  api: ['services/api.ts', 'frontend-api'],
  'virtual-list': ['components/shared/virtual-list/index.ts', 'frontend-performance'],
};
const chosen = [];
const add = (name) => {
  if (chosen.includes(name)) return;
  blocks[name].blocks?.forEach(add);
  chosen.push(name);
};
names.forEach(add);

const missing = new Map();
for (const need of ['base', ...chosen.flatMap((n) => blocks[n].needs ?? [])]) {
  const [file, from] = NEEDS[need] ?? ['components/ui/fields/index.ts', 'frontend-core'];
  if (!existsSync(path.join(src, file))) missing.set(file, from);
}
if (missing.size) {
  console.error('Missing in the project:');
  for (const [file, from] of missing) console.error(`  src/${file}  from ${from}`);
  console.error('Run add-to-project.mjs of these skills first (frontend-core with --components).');
  process.exit(1);
}

let added = 0;
const kept = [];
for (const name of chosen) {
  const root = path.join(assets, 'blocks', name);
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const source = path.join(entry.parentPath, entry.name);
    const relative = path.relative(root, source);
    const target = path.join(project, relative);
    if (existsSync(target)) {
      kept.push(relative);
      continue;
    }
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(source, target);
    added++;
  }
}

// Paths the pages use.
const routesFile = path.join(src, 'config/routes.ts');
const wanted = Object.entries(Object.assign({}, ...chosen.map((n) => blocks[n].routes ?? {})));
if (wanted.length && existsSync(routesFile)) {
  let text = readFileSync(routesFile, 'utf8');
  for (const [key, value] of wanted) {
    if (new RegExp(`^  ${key}:`, 'm').test(text)) continue;
    if (!text.includes('} as const;')) {
      console.log(`todo   ROUTES.${key}: '${value}' in src/config/routes.ts`);
      continue;
    }
    text = text.replace('} as const;', () => `  ${key}: '${value}',\n} as const;`);
  }
  writeFileSync(routesFile, text);
}

const packages = [...new Set(chosen.flatMap((n) => blocks[n].packages ?? []))];
const manifest = path.join(project, 'package.json');
const { dependencies = {} } = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : {};
const install = packages.filter((p) => !dependencies[p]);
console.log(`${chosen.join(', ')}: ${added} files added${kept.length ? `, ${kept.length} kept because they exist` : ''}.`);
for (const file of kept.slice(0, 10)) console.log(`  kept ${file}`);
if (install.length) console.log(`Install: node scripts/resolve-versions.mjs --project ${install.join(' ')}`);
for (const name of chosen) if (blocks[name].next) console.log(`${name}: ${blocks[name].next}`);
if (existsSync(path.join(project, 'scripts/index-components.mjs'))) console.log('Then: node scripts/index-components.mjs');
