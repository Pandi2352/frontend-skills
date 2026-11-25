#!/usr/bin/env node
// Copies the API and auth code into a project. Never overwrites a file.
//
//   node add-to-project.mjs <project-folder>

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const template = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/template');
const project = process.argv[2] && path.resolve(process.argv[2]);

if (!project || !existsSync(project) || !statSync(project).isDirectory()) {
  console.error('Usage: node add-to-project.mjs <existing-project-folder>');
  process.exit(1);
}
let added = 0;
const kept = [];
for (const entry of readdirSync(template, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const source = path.join(entry.parentPath, entry.name);
  const relative = path.relative(template, source);
  const target = path.join(project, relative);
  if (existsSync(target)) {
    kept.push(relative);
    continue;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(source, target);
  added++;
}

console.log(`${added} files added${kept.length ? `, ${kept.length} kept because they exist` : ''}.`);
for (const file of kept.slice(0, 10)) console.log(`  kept ${file}`);
