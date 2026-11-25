#!/usr/bin/env node
// Adds the standards to a project so any AI tool can follow them.
// Never overwrites an existing file.
//
//   node add-to-project.mjs <project-folder>            rules and standards
//   node add-to-project.mjs <project-folder> --components   also the finished components

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = process.argv[2] && path.resolve(process.argv[2]);

if (!project || !existsSync(project) || !statSync(project).isDirectory()) {
  console.error('Usage: node add-to-project.mjs <existing-project-folder> [--components]');
  process.exit(1);
}

function add(target, write) {
  const file = path.join(project, target);
  if (existsSync(file)) return console.log(`kept   ${target} (already exists)`);
  mkdirSync(path.dirname(file), { recursive: true });
  write(file);
  console.log(`added  ${target}`);
}

const copy = (source, target) => add(target, (file) => copyFileSync(path.join(skill, source), file));

copy('assets/AGENTS.md', 'AGENTS.md');
add('CLAUDE.md', (file) => writeFileSync(file, '@AGENTS.md\n'));
add('GEMINI.md', (file) => writeFileSync(file, '@./AGENTS.md\n'));
for (const name of readdirSync(path.join(skill, 'references'))) {
  copy(`references/${name}`, `docs/standards/${name}`);
}
for (const name of ['resolve-versions', 'generate', 'index-components']) copy(`scripts/${name}.mjs`, `scripts/${name}.mjs`);

if (process.argv.includes('--components')) {
  const source = path.join(skill, 'assets/template/src');
  for (const entry of readdirSync(source, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.relative(skill, path.join(entry.parentPath, entry.name));
    copy(file, path.relative('assets/template', file));
  }
}
