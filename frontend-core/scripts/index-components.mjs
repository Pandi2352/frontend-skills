#!/usr/bin/env node
// Writes docs/COMPONENTS.md: every shared component, hook and util with its props,
// in one short file. Read it instead of opening many files, and to see what exists
// before writing something new.
//
//   node index-components.mjs [project]           write
//   node index-components.mjs [project] --check   exit 1 when it is out of date

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const project = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const src = path.join(project, 'src');
if (!existsSync(src)) {
  console.error(`No src folder in ${project}`);
  process.exit(2);
}

const files = readdirSync(src, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.tsx?$/.test(e.name) && !/\.(test|spec|d)\.tsx?$/.test(e.name))
  .map((e) => path.relative(src, path.join(e.parentPath, e.name)).replaceAll('\\', '/'))
  .sort();
const read = (file) => readFileSync(path.join(src, file), 'utf8').replaceAll('\r\n', '\n');
const has = new Set(files);

/** The text between a bracket and its partner. */
function inside(text, start, open = '{', close = '}') {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) return text.slice(start + 1, i);
  }
  return '';
}
const noComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');

/** Names of an object such as `variants`, so nobody has to guess the choices. */
function choices(text, name) {
  const at = new RegExp(`const ${name}\\b[^=]*= \\{`).exec(text);
  if (!at) return null;
  // Only the first level; nested objects are not choices.
  let body = noComments(inside(text, at.index + at[0].length - 1));
  for (let before = ''; before !== body; ) {
    before = body;
    body = body.replace(/\{[^{}]*\}/g, '0').replace(/'[^'\n]*'(?=\s*[,\n])/g, '0');
  }
  const names = [...body.matchAll(/(?:^|[,{\n])\s*'?([\w-]+)'?\s*:/g)].map((m) => m[1]);
  return names.length && names.length < 12 ? [...new Set(names)].map((n) => `'${n}'`).join(' | ') : null;
}

/** "size?: 'sm' | 'md'" for each prop; long types are left out. */
function props(body, text = '') {
  const out = [];
  let depth = 0;
  let part = '';
  for (const c of noComments(body)) {
    if ('({[<'.includes(c)) depth++;
    else if (')}]'.includes(c) || (c === '>' && !part.endsWith('='))) depth--;
    if (depth === 0 && (c === ';' || c === '\n' || c === ',')) {
      out.push(part);
      part = '';
    } else part += c;
  }
  out.push(part);
  return out
    .map((p) => p.replace(/\s+/g, ' ').replace(/ \| undefined\b/g, '').trim())
    .filter((p) => /^['\w-]+\??\s*:/.test(p))
    .map((p) => {
      const [, key, type] = /^(['\w-]+\??)\s*:\s*(.*)$/.exec(p) ?? [];
      const list = /^keyof typeof (\w+)$/.exec(type)?.[1];
      const named = list && choices(text, list);
      if (named) return `${key}: ${named}`;
      const short = type.replace(/^\(\((.*)\)\)$/, '($1)').replace(/^\((\(.*\) => [^)]*)\)$/, '$1');
      return short === 'boolean' ? key : short.length > 46 ? key : `${key}: ${short}`;
    })
    .filter((p) => !/^(className|ref|children\?)/.test(p));
}

const docBefore = (text, at) => {
  const match = /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*$/.exec(text.slice(0, at));
  if (!match) return '';
  const words = match[1].replace(/^\s*\*/gm, '').replace(/\s+/g, ' ').trim();
  return words.length > 160 ? `${words.slice(0, words.indexOf('. ') > 0 ? words.indexOf('. ') + 1 : 157)}` : words;
};

/** An interface or object type: its own props and what it is built on. */
function declaration(text, name) {
  const start = new RegExp(`^(?:export )?(interface|type) ${name}\\b`, 'm').exec(text);
  if (!start) return null;
  let at = start.index + start[0].length;
  if (text[at] === '<') at += inside(text, at, '<', '>').length + 2;
  const open = text.indexOf('{', at);
  const end = text.indexOf(';', at);
  const isType = start[1] === 'type';
  if (open < 0 || (isType && end >= 0 && end < open)) {
    return isType ? { list: [], base: text.slice(at, end).replace(/^\s*=\s*/, '').replace(/\s+/g, ' ').trim() } : null;
  }
  const head = text.slice(at, open).replace(/^\s*(extends|=)\s*/, '').replace(/\s*&\s*$/, '').replace(/\s+/g, ' ').trim();
  return { list: props(inside(text, open), text), base: head };
}

function propsOf(text, name, signatureAt) {
  const declared = declaration(text, `${name}Props`);
  if (declared) return declared;
  const open = text.indexOf('(', signatureAt);
  const params = open < 0 ? '' : inside(text, open, '(', ')');
  const inline = /\}\s*:\s*(?:[\w<>', |&]+&\s*)?\{/.exec(params) ?? /^\s*\w+\s*:\s*\{/.exec(params);
  if (inline) return { list: props(inside(params, inline.index + inline[0].length - 1), text), base: /:\s*([\w<>', |]+)&/.exec(inline[0])?.[1].trim() ?? '' };
  return { list: [], base: /:\s*([\w.<>'| ]+Props[\w<>]*)/.exec(params)?.[1] ?? '' };
}

// Bases that several components share are listed once at the end.
const bases = new Set();
const ours = new Map();
for (const file of files) {
  const text = read(file);
  for (const [, name] of text.matchAll(/^(?:export )?(?:interface|type) ([A-Z]\w*)/gm)) if (!ours.has(name)) ours.set(name, text);
}

function components(file) {
  const text = read(file);
  return [...text.matchAll(/export (?:function|const|class) ([A-Z]\w*)/g)]
    .filter(([, name]) => !/^[A-Z\d_]+$/.test(name) && !/Context$/.test(name))
    .map((match) => {
      const { list, base } = propsOf(text, match[1], match.index);
      const shortBase = base.replace(/,?\s*ValueProps<([\s\S]*?)>(?=,|$)/, (_, t) => `, value ${t}`).replace(/BaseFieldProps,?\s*/, '').replace(/^,\s*/, '').trim();
      for (const [word] of shortBase.matchAll(/\b[A-Z]\w+\b/g)) if (ours.has(word)) bases.add(word);
      return `- **${match[1]}**${list.length ? ` \`${list.join('; ')}\`` : ''}${shortBase && shortBase.length < 90 ? ` + ${shortBase}` : ''}${docBefore(text, match.index) ? ` - ${docBefore(text, match.index)}` : ''}`;
    });
}

function functions(file, only = /^/) {
  const text = read(file);
  return [...text.matchAll(/export (?:async )?(?:function|const) ([a-z]\w*)/g)]
    .filter(([, name]) => only.test(name))
    .map((match) => {
      const open = text.indexOf('(', match.index);
      const arrow = /=\s*(?:async )?(?:<[^>]*>)?\(|function/.test(text.slice(match.index, open + 1));
      const params = arrow ? noComments(inside(text, open, '(', ')')).replace(/\s+/g, ' ').replace(/, ?$/, '').trim() : '';
      const call = arrow ? `(${params.length > 80 ? '…' : params})` : '';
      const doc = docBefore(text, match.index);
      return `- **${match[1]}**\`${call || ' '}\`${doc ? ` - ${doc}` : ''}`.replace('`` ', '').replace('` `', '');
    });
}

/** Where to import from: the highest folder with an index file that exports it. */
function importPath(file) {
  const parts = file.split('/');
  for (let n = 2; n < parts.length; n++) {
    const folder = parts.slice(0, n).join('/');
    if (has.has(`${folder}/index.ts`)) {
      const rest = parts.slice(n).join('/').replace(/\.tsx?$/, '');
      return read(`${folder}/index.ts`).includes(`./${rest}'`) ? `@/${folder}` : null;
    }
  }
  return `@/${file.replace(/\.tsx?$/, '')}`;
}

const out = [
  '# Components, hooks and utils',
  '',
  'Written by `scripts/index-components.mjs`; do not edit. Reuse these before writing',
  'anything new. Every component also takes `className`, `ref` and native props where',
  'it makes sense. A prop without a type is a boolean or has a long type.',
  '',
];
const groups = new Map();
for (const file of files.filter((f) => /^(components|app\/layouts|app\/providers)\/.*\.tsx$/.test(f))) {
  const from = file.startsWith('app/') ? `@/${file.replace(/\.tsx$/, '')}` : importPath(file);
  if (!from) continue;
  const lines = components(file);
  if (lines.length) groups.set(from, [...(groups.get(from) ?? []), ...lines]);
}
out.push('## Components', '');
const base = has.has('components/ui/fields/base/field.types.ts') && /interface BaseFieldProps \{/.exec(read('components/ui/fields/base/field.types.ts'));
for (const [from, lines] of groups) {
  out.push(`### ${from}`, '');
  if (from === '@/components/ui/fields' && base) {
    const text = read('components/ui/fields/base/field.types.ts');
    out.push(`Every field: \`${props(inside(text, text.indexOf('{', base.index)), text).join('; ')}\``, '');
  }
  out.push(...lines, '');
}
const shared = [];
for (const name of bases) {
  const found = declaration(ours.get(name), name);
  if (name === 'BaseFieldProps' || !found || (!found.list.length && !found.base)) continue;
  shared.push(`- **${name}**${found.list.length ? ` \`${found.list.join('; ')}\`` : ''}${found.base && found.base.length < 90 ? ` + ${found.base.replace(/BaseFieldProps,?\s*/, '')}` : ''}`);
  // A base of a base; a Set also visits what is added meanwhile.
  for (const [word] of found.base.matchAll(/\b[A-Z]\w+\b/g)) if (ours.has(word) && word !== 'BaseFieldProps' && word !== 'ValueProps') bases.add(word);
}
if (shared.length) out.push('## Shared props', '', ...shared.sort(), '');
for (const [title, pattern, only] of [
  ['Hooks', /^(hooks|components)\/.*\.tsx?$/, /^use[A-Z]/],
  ['Utils and lib', /^(utils|lib)\/.*\.ts$/, /^/],
]) {
  const lines = files.filter((f) => pattern.test(f)).flatMap((f) => {
    const list = functions(f, only);
    return list.length ? [`${title === 'Hooks' ? '' : `\`@/${f.replace(/\.tsx?$/, '')}\`\n\n`}${list.join('\n')}${title === 'Hooks' ? '' : '\n'}`] : [];
  });
  if (lines.length) out.push(`## ${title}`, '', ...lines, '');
}
const features = files.filter((f) => /^features\/[^/]+\/index\.ts$/.test(f));
if (features.length) out.push('## Features', '', ...features.map((f) => `- \`@/${path.posix.dirname(f)}\``), '');

const text = `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
const target = path.join(project, 'docs/COMPONENTS.md');
if (args.includes('--check')) {
  const same = existsSync(target) && readFileSync(target, 'utf8').replaceAll('\r\n', '\n') === text;
  console.log(same ? 'docs/COMPONENTS.md is up to date.' : 'docs/COMPONENTS.md is out of date. Run index-components.mjs.');
  process.exit(same ? 0 : 1);
}
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, text);
console.log(`Wrote docs/COMPONENTS.md (${(text.length / 1000).toFixed(1)} kB, ${groups.size} import paths).`);
