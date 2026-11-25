#!/usr/bin/env node
// Checks the built files against performance.budget.json. Run after the build.
// Sizes are compressed (gzip), like visitors download them.
//
//   node check-size.mjs [project]
//
// Needs `build.manifest: true` (see vite.performance.ts).

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const project = path.resolve(process.argv[2] ?? '.');
const dist = path.join(project, 'dist');
const budgetFile = path.join(project, 'performance.budget.json');
const manifestFile = path.join(dist, '.vite/manifest.json');
for (const [file, help] of [
  [budgetFile, 'Copy it from the frontend-performance skill.'],
  [manifestFile, 'Use vite.performance.ts in vite.config.ts and run the build.'],
]) {
  if (!existsSync(file)) {
    console.error(`Missing ${path.relative(project, file)}. ${help}`);
    process.exit(2);
  }
}
const { size: budget } = JSON.parse(readFileSync(budgetFile, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));

const cache = new Map();
const gzip = (file) => {
  if (!cache.has(file)) cache.set(file, gzipSync(readFileSync(path.join(dist, file))).length / 1000);
  return cache.get(file);
};
const sum = (files) => [...files].reduce((total, f) => total + gzip(f), 0);

/** The chunk and everything it imports directly. */
function closure(key, keys = new Set()) {
  if (keys.has(key)) return keys;
  keys.add(key);
  for (const next of manifest[key].imports ?? []) closure(next, keys);
  return keys;
}
const jsOf = (keys) => new Set([...keys].map((k) => manifest[k].file).filter((f) => f.endsWith('.js')));
const cssOf = (keys) => new Set([...keys].flatMap((k) => manifest[k].css ?? []));

const rows = [];
const check = (kind, name, kb, limit) => rows.push({ kind, name, kb, limit, ok: limit === undefined || kb <= limit });

const first = new Set(Object.keys(manifest).filter((k) => manifest[k].isEntry).flatMap((k) => [...closure(k)]));
check('First load', 'JavaScript', sum(jsOf(first)), budget.firstLoadJs);
check('First load', 'CSS', sum(cssOf(first)), budget.firstLoadCss);

const firstJs = jsOf(first);
const firstCss = cssOf(first);
for (const key of Object.keys(manifest).filter((k) => manifest[k].isDynamicEntry)) {
  const keys = closure(key);
  const added = [...jsOf(keys)].filter((f) => !firstJs.has(f)).concat([...cssOf(keys)].filter((f) => !firstCss.has(f)));
  check('On demand', key.replace(/^.*node_modules\//, ''), sum(added), budget.pageJs);
}

for (const entry of readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const full = path.join(entry.parentPath, entry.name);
  const name = path.relative(dist, full).replaceAll('\\', '/');
  const kb = statSync(full).size / 1000;
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(name)) check('Image', name, kb, budget.image);
  else if (/\.svg$/i.test(name)) check('Image', name, gzip(name), budget.image);
  else if (/\.(woff2?|ttf|otf)$/i.test(name)) check('Font', name, kb, budget.font);
}

rows.sort((a, b) => Number(a.ok) - Number(b.ok));
const bad = rows.filter((r) => !r.ok);
for (const kind of ['First load', 'On demand', 'Image', 'Font']) {
  const list = rows.filter((r) => r.kind === kind);
  if (!list.length) continue;
  console.log(`\n${kind}`);
  const shown = list.filter((r) => !r.ok).concat(list.filter((r) => r.ok).sort((a, b) => b.kb - a.kb).slice(0, 8));
  for (const r of shown) {
    const limit = r.limit === undefined ? '' : ` / ${r.limit} kB`;
    console.log(`  ${r.ok ? 'ok  ' : 'OVER'} ${r.kb.toFixed(1).padStart(7)}${limit.padEnd(10)} ${r.name}`);
  }
  if (list.length > shown.length) console.log(`  ... ${list.length - shown.length} smaller`);
}
console.log(bad.length ? `\n${bad.length} over budget. Split, lazy-load or replace it; do not raise the budget first.` : '\nWithin budget.');
process.exit(bad.length ? 1 : 0);
