#!/usr/bin/env node
// Finds the newest stable version of each package that supports the installed
// Node and fits the other packages in the list. Read-only: installs nothing.
//
//   node resolve-versions.mjs                  default FrontendCore stack
//   node resolve-versions.mjs zod d3 -D msw    these packages (-D: dev from here)
//   node resolve-versions.mjs --project        packages in ./package.json
//
// --project also works as context for new packages: --project zod

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const STACK = [
  'react', 'react-dom', 'react-router-dom', 'react-hook-form', 'lucide-react',
  'clsx', 'tailwind-merge', '@floating-ui/react', 'libphonenumber-js',
  'country-region-data', '@tanstack/react-virtual',
];
const STACK_DEV = [
  'vite', '@vitejs/plugin-react', 'typescript', 'tailwindcss',
  '@tailwindcss/vite', '@types/node', '@types/react', '@types/react-dom',
  'eslint', '@eslint/js', 'typescript-eslint', 'globals',
  'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh',
  'eslint-plugin-jsx-a11y-x', 'eslint-config-prettier', 'prettier',
  'prettier-plugin-tailwindcss', 'vitest', 'jsdom', '@testing-library/react',
  '@testing-library/dom', '@testing-library/jest-dom',
  '@testing-library/user-event',
];

const npm = (args) => execSync(`npm ${args}`, { encoding: 'utf8' }).trim();

// npm ships semver, so nothing extra has to be installed.
function loadSemver() {
  const nodeDir = path.dirname(realpathSync(process.execPath));
  const places = [
    path.join(nodeDir, 'node_modules/npm'),
    path.join(nodeDir, '../lib/node_modules/npm'),
    path.join(npm('root -g'), 'npm'),
  ];
  for (const place of places) {
    const file = path.join(place, 'package.json');
    if (existsSync(file)) return createRequire(file)('semver');
  }
  throw new Error('Could not find the semver package bundled with npm.');
}

const semver = loadSemver();
const node = process.versions.node;
const registry = npm('config get registry').replace(/\/$/, '');

const args = process.argv.slice(2);
const useProject = args.includes('--project');
const deps = new Set();
const devDeps = new Set();
let target = deps;
for (const arg of args) {
  if (arg === '--project') continue;
  if (arg === '-D') target = devDeps;
  else target.add(arg);
}
if (useProject) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const isRegistryRange = ([, range]) => semver.validRange(range) !== null;
  for (const [n] of Object.entries(pkg.dependencies ?? {}).filter(isRegistryRange)) deps.add(n);
  for (const [n] of Object.entries(pkg.devDependencies ?? {}).filter(isRegistryRange)) devDeps.add(n);
} else if (deps.size + devDeps.size === 0) {
  STACK.forEach((n) => deps.add(n));
  STACK_DEV.forEach((n) => devDeps.add(n));
}
for (const n of deps) devDeps.delete(n);
const names = [...deps, ...devDeps];

async function load(name) {
  const res = await fetch(`${registry}/${name.replace('/', '%2F')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${name}: registry returned ${res.status}`);
  const data = await res.json();
  const latest = data['dist-tags'].latest;
  const nodeOk = (m) =>
    typeof m.engines?.node !== 'string' ||
    semver.validRange(m.engines.node) === null ||
    semver.satisfies(node, m.engines.node);
  const candidates = Object.values(data.versions)
    .filter((m) => !semver.prerelease(m.version) && semver.lte(m.version, latest))
    .filter((m) => !m.deprecated && nodeOk(m))
    // Node typings must describe the installed Node, not a newer one.
    .filter((m) => name !== '@types/node' || semver.major(m.version) <= semver.major(node))
    .sort((a, b) => semver.rcompare(a.version, b.version));
  if (!candidates.length) throw new Error(`${name}: no stable version supports Node ${node}`);
  return { name, latest, candidates, pick: candidates[0], why: candidates[0].version === latest ? '' : `newest for Node ${node}` };
}

let items;
try {
  items = new Map((await Promise.all(names.map(load))).map((i) => [i.name, i]));
} catch (error) {
  console.error(`Could not resolve versions: ${error.message}`);
  if (error.cause) console.error(String(error.cause));
  process.exit(1);
}

// All peer requirements between the picked packages that are not met.
function conflicts() {
  const found = [];
  for (const item of items.values()) {
    for (const [peer, range] of Object.entries(item.pick.peerDependencies ?? {})) {
      const other = items.get(peer);
      if (other && !semver.satisfies(other.pick.version, range)) found.push({ item, other, range });
    }
  }
  return found;
}

// Lower a package only when another package cannot work with its newest one.
let open = conflicts();
for (let guard = 0; open.length && guard < 200; guard++) {
  let changed = false;
  for (const { item, other, range } of open) {
    const lower = other.candidates.find(
      (m) => semver.lt(m.version, other.pick.version) && semver.satisfies(m.version, range),
    );
    if (!lower) continue;
    other.pick = lower;
    other.why = `${item.name} needs ${range}`;
    changed = true;
    break;
  }
  if (!changed) break;
  open = conflicts();
}

const width = Math.max(...names.map((n) => n.length));
console.log(`Node ${node}\n`);
for (const { name, pick, latest, why } of items.values()) {
  console.log(`${name.padEnd(width)}  ${pick.version}${why ? `  (latest ${latest}; ${why})` : ''}`);
}

const spec = (set) => [...set].map((n) => `${n}@${items.get(n).pick.version}`).join(' ');
console.log('');
if (deps.size) console.log(`npm install ${spec(deps)}`);
if (devDeps.size) console.log(`npm install -D ${spec(devDeps)}`);

if (open.length) {
  console.log('\nUnresolved peer conflicts:');
  for (const { item, other, range } of open) {
    console.log(`- ${item.name}@${item.pick.version} needs ${other.name} ${range}`);
  }
  process.exit(2);
}
