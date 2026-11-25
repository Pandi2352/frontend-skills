#!/usr/bin/env node
// Copies the skills to the folders AI coding tools read. Run again to update.
//
//   node install.mjs                       every tool found on this computer
//   node install.mjs --tool cursor,codex   only these
//   node install.mjs frontend-core         only this skill
//   node install.mjs --project <folder>    into a project, to share it with a team
//   node install.mjs --list                what would be installed where
//   node install.mjs --uninstall

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = path.join(path.dirname(fileURLToPath(import.meta.url)), 'skills');
const home = homedir();

// `~/.agents/skills` is read by several tools; some also read `~/.claude/skills`.
const SHARED = path.join(home, '.agents/skills');
const TOOLS = {
  codex: SHARED,
  cursor: SHARED,
  opencode: SHARED,
  gemini: SHARED,
  copilot: SHARED,
  kilo: SHARED,
  claude: path.join(home, '.claude/skills'),
  windsurf: path.join(home, '.codeium/windsurf/skills'),
  cline: path.join(home, '.cline/skills'),
  antigravity: path.join(home, '.gemini/config/skills'),
  roo: path.join(home, '.roo/skills'),
};
// A tool counts as present when its own folder exists.
const PRESENT = {
  claude: '.claude', windsurf: '.codeium/windsurf', cline: '.cline', antigravity: '.gemini/config', roo: '.roo',
};

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      tool: { type: 'string' }, project: { type: 'string' },
      list: { type: 'boolean', default: false }, uninstall: { type: 'boolean', default: false },
    },
  });
} catch (error) {
  console.error(`${error.message}. See the first lines of install.mjs.`);
  process.exit(2);
}
const { values: opt, positionals } = args;
const available = readdirSync(here).filter((name) => existsSync(path.join(here, name, 'SKILL.md')));
const unknown = positionals.filter((name) => !available.includes(name));
if (unknown.length) {
  console.error(`Unknown skill: ${unknown.join(', ')}. Available: ${available.join(', ')}`);
  process.exit(2);
}
const skills = positionals.length ? positionals : available;

let targets;
if (opt.project) {
  if (!existsSync(opt.project)) {
    console.error(`No folder ${opt.project}`);
    process.exit(2);
  }
  targets = ['.agents/skills', '.claude/skills'].map((f) => path.resolve(opt.project, f));
} else if (opt.tool) {
  const names = opt.tool.split(',').map((t) => t.trim().toLowerCase());
  const wrong = names.filter((t) => !Object.hasOwn(TOOLS, t));
  if (wrong.length) {
    console.error(`Unknown tool: ${wrong.join(', ')}. Use: ${Object.keys(TOOLS).join(', ')}`);
    process.exit(2);
  }
  targets = [...new Set(names.map((t) => TOOLS[t]))];
} else {
  targets = [SHARED, ...Object.entries(PRESENT).filter(([, folder]) => existsSync(path.join(home, folder))).map(([tool]) => TOOLS[tool])];
}

const toolsOf = (target) => Object.entries(TOOLS).filter(([, folder]) => folder === target).map(([tool]) => tool);
const files = (folder) => readdirSync(folder, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));

for (const root of targets) {
  const where = `${root}${toolsOf(root).length ? `  (${toolsOf(root).join(', ')})` : ''}`;
  if (opt.list) {
    console.log(where);
    continue;
  }
  const done = [];
  for (const name of skills) {
    const target = path.join(root, name);
    // Never follow a link someone else made.
    if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
      console.log(`skipped ${target} (it is a link)`);
      continue;
    }
    if (existsSync(target)) {
      // Remove file by file: deleting the folder fails on Windows while a tool watches it.
      for (const file of files(target)) {
        if (opt.uninstall || !existsSync(path.join(here, name, path.relative(target, file)))) rmSync(file);
      }
      const folders = readdirSync(target, { recursive: true, withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(e.parentPath, e.name));
      for (const folder of [...folders.sort((a, b) => b.length - a.length), ...(opt.uninstall ? [target] : [])]) {
        try {
          rmdirSync(folder); // only when empty
        } catch {
          // Still used.
        }
      }
    }
    if (!opt.uninstall) {
      mkdirSync(root, { recursive: true });
      cpSync(path.join(here, name), target, { recursive: true });
    }
    done.push(name);
  }
  if (done.length) console.log(`${opt.uninstall ? 'removed from' : 'installed to'} ${where}`);
}
if (opt.list) console.log(`Skills: ${skills.join(', ')}`);
else if (!opt.uninstall) console.log('Start a new session in your AI tool.');
