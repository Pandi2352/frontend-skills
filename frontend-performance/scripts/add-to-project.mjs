#!/usr/bin/env node
// Copies the performance code, checks and standards into a project.
// Never overwrites a file.
//
//   node add-to-project.mjs <project-folder>

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = process.argv[2] && path.resolve(process.argv[2]);

if (!project || !existsSync(project) || !statSync(project).isDirectory()) {
  console.error('Usage: node add-to-project.mjs <existing-project-folder>');
  process.exit(1);
}

function copyAll(from, to) {
  const root = path.join(skill, from);
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const source = path.join(entry.parentPath, entry.name);
    if (!entry.isFile() || source === fileURLToPath(import.meta.url)) continue;
    const target = path.join(to, path.relative(root, source));
    const file = path.join(project, target);
    if (existsSync(file)) {
      console.log(`kept   ${target} (already exists)`);
      continue;
    }
    mkdirSync(path.dirname(file), { recursive: true });
    copyFileSync(source, file);
    console.log(`added  ${target}`);
  }
}

copyAll('assets/template', '.');
copyAll('scripts', 'scripts/performance');
copyAll('references', 'docs/standards/performance');

if (!existsSync(path.join(project, 'src/lib/lazy.ts'))) {
  console.log('\nnote: src/lib/lazy.ts is missing. This code uses frontend-core components; add them first,');
  console.log('or copy src/lib/lazy.ts and src/hooks/useStableCallback.ts from an up-to-date frontend-core.');
}
