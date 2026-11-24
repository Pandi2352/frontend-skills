#!/usr/bin/env node
// Copies every skill in this folder to the places AI tools read.
// Run again after editing a skill.
//
//   node install.mjs            all skills
//   node install.mjs <name>     one skill

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const here = import.meta.dirname;
const wanted = process.argv.slice(2);
const skills = readdirSync(here).filter(
  (name) => existsSync(path.join(here, name, 'SKILL.md')) && (!wanted.length || wanted.includes(name)),
);
if (!skills.length) {
  console.error('No matching skill found.');
  process.exit(1);
}
for (const folder of ['.agents', '.claude']) {
  const root = path.join(homedir(), folder, 'skills');
  mkdirSync(root, { recursive: true });
  for (const name of skills) {
    const target = path.join(root, name);
    if (existsSync(target)) {
      // Never follow a link someone else made.
      if (lstatSync(target).isSymbolicLink()) {
        console.log(`skipped ${target} (it is a link)`);
        continue;
      }
      // Remove only files the skill no longer has. Deleting the whole folder fails
      // on Windows while an AI tool is watching it.
      for (const entry of readdirSync(target, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const file = path.join(entry.parentPath, entry.name);
        if (!existsSync(path.join(here, name, path.relative(target, file)))) rmSync(file);
      }
    }
    cpSync(path.join(here, name), target, { recursive: true });
    console.log(`installed ${target}`);
  }
}
