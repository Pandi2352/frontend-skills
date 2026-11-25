#!/usr/bin/env node
// Runs every check and prints one line each; only failures show details, and only
// their first lines. So the result fits in a few hundred tokens.
//
//   node verify.mjs          types, lint, tests, build, size, scan
//   node verify.mjs --fast   types, plus lint, tests and scan of changed files (git)
//   node verify.mjs --all    do not shorten the output

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { stripVTControlCharacters } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fast = process.argv.includes('--fast');
const all = process.argv.includes('--all');
const here = path.dirname(fileURLToPath(import.meta.url));
if (!existsSync('package.json')) {
  console.error('Run this in the project folder.');
  process.exit(2);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const has = (name) => existsSync(path.join('node_modules', name));
const script = (name) => [path.join(here, name), path.join('scripts', name)].find(existsSync);
const quote = (f) => `"${f}"`;

let changed = null;
if (fast) {
  try {
    const git = (args) => execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean);
    changed = [...new Set([...git('diff --name-only --relative HEAD'), ...git('ls-files --others --exclude-standard')])]
      .filter((f) => /^src\/.*\.[jt]sx?$/.test(f) && existsSync(f));
  } catch {
    console.log('no git here, so everything is checked');
  }
}
const list = changed?.map(quote).join(' ');
const nothing = changed && !changed.length;

const steps = [
  ['types', has('typescript') && existsSync('tsconfig.json') && (existsSync('tsconfig.app.json') ? 'npx tsc -b --noEmit' : 'npx tsc --noEmit')],
  ['lint', has('eslint') && !nothing && `npx eslint --max-warnings 0 ${list ?? '.'}`],
  ['tests', has('vitest') && !nothing && (changed ? `npx vitest related --run --silent --passWithNoTests --reporter=dot ${list}` : 'npx vitest run --silent --passWithNoTests --reporter=dot')],
  ['build', !fast && has('vite') && 'npx vite build --logLevel error'],
  ['size', !fast && existsSync('performance.budget.json') && script('performance/check-size.mjs') && `node ${quote(script('performance/check-size.mjs'))}`],
  ['scan', !nothing && script('scan.mjs') && `node ${quote(script('scan.mjs'))} . ${list ?? ''}`],
];

// Lines that say nothing about the cause.
const noise = /^\s*$|^\s*at |^\s*❯ (?:node_modules|process|async)|node:internal|^\s*[-⎯─═]{5,}|^ RUN |Duration|Start at|^\s*\^+\s*$|npm (?:warn|notice)|^Ignored nodes|^\s*<\/?\w|^\s*[\w-]+="/;

let failed = 0;
for (const [name, command] of steps) {
  if (!command) continue;
  const start = Date.now();
  const result = spawnSync(command, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', CI: '1' } });
  const seconds = `${((Date.now() - start) / 1000).toFixed(0)}s`;
  const output = stripVTControlCharacters(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  if (result.status === 0) {
    const count = /Tests\s+(\d+) passed/.exec(output)?.[1];
    // The scan passes with notes; they are still worth reading.
    const notes = name === 'scan' ? /(High \d+, Medium \d+, Low \d+)/.exec(output)?.[1] : '';
    console.log(`ok    ${name.padEnd(6)} ${seconds}${count ? `  ${count} tests` : ''}${notes ? `  ${notes}` : ''}`);
    if (name === 'scan' && /Medium [1-9]/.test(output)) console.log(output.split('\n').filter((l) => /^(Medium|High)|^  \S/.test(l)).slice(0, 12).map((l) => `      ${l}`).join('\n'));
    continue;
  }
  failed++;
  console.log(`FAIL  ${name.padEnd(6)} ${seconds}`);
  // Tests: only from the first failure on.
  const from = name === 'tests' ? Math.max(0, output.search(/^ ?FAIL /m)) : 0;
  const lines = [...new Set(output.slice(from).split('\n').map((l) => l.trimEnd()))].filter((l) => all || !noise.test(l));
  const shown = all ? lines : lines.slice(0, 25);
  for (const line of shown) console.log(`      ${all ? line : line.slice(0, 220)}`);
  if (lines.length > shown.length) console.log(`      … ${lines.length - shown.length} more lines: ${command}`);
}
if (!pkg.name && !failed) console.log('note  package.json has no name');
console.log(failed ? `\n${failed} failed. Fix the first one, then run again.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
