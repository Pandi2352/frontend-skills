// Shared by create.mjs and steps.mjs: copies parts with everything they import, and
// writes the files that connect them.

import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const core = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const sibling = (name) => path.resolve(core, '..', name);
const text = (file) => readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
const slash = (p) => p.split(path.sep).join('/');
const isFile = (f) => existsSync(f) && statSync(f).isFile();
const listFiles = (root) =>
  existsSync(root)
    ? readdirSync(root, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => slash(path.relative(root, path.join(e.parentPath, e.name))))
    : [];

export function fail(message) {
  console.error(message);
  process.exit(1);
}
export function run(file, args, cwd) {
  const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', cwd });
  if (result.status !== 0) fail(`${path.basename(file)} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}
export function write(project, file, content) {
  const full = path.join(project, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, `${content.replace(/^\n/, '').trimEnd()}\n`);
}
export function edit(project, file, ...pairs) {
  const full = path.join(project, file);
  let content = text(full);
  for (const [from, to] of pairs) {
    if (!(typeof from === 'string' ? content.includes(from) : from.test(content))) fail(`${file}: "${from}" not found`);
    content = content.replace(from, () => to);
  }
  writeFileSync(full, content);
}

// ---- State of a project, readable for people in docs/PROGRESS.md

const stateFile = (project) => path.join(project, 'docs/steps.json');
export const loadState = (project) => (existsSync(stateFile(project)) ? JSON.parse(text(stateFile(project))) : null);
export function saveState(project, state) {
  write(project, 'docs/steps.json', JSON.stringify(state, null, 2));
  const mark = { todo: '[ ]', built: '[~]', ok: '[x]' };
  write(project, 'docs/PROGRESS.md', `# Progress

[x] checked, [~] built and waiting for the developer's check, [ ] asked for, not built yet

${state.steps.map((s, i) => `- ${mark[s.state]} ${i + 1}. ${stepInfo(s.id).title}`).join('\n')}
`);
}

// ---- Steps

export const STEPS = {
  setup: { title: 'Setup: config, theme and packages', check: ['npm run dev opens without errors', 'the main color, font and app name are right (src/styles/theme.css, src/config/app.config.ts)'] },
  layout: { title: 'Layout: sidebar, navbar and page frame', check: ['/ : menu, collapse button (Ctrl+B), page title', 'narrow window: the menu opens as a drawer', 'an unknown address shows "Page not found"'] },
  basics: { title: 'Common components: buttons, cards, tabs, dialogs, toasts, loaders, states', check: ['/playground : look, hover, keyboard (Tab, Enter, Escape)', 'toast, modal, drawer and confirm open and close'] },
  forms: { title: 'Form fields and forms', check: ['/playground/fields : all fields have the same height', 'Save with empty fields: errors below the fields, focus on the first', 'dropdown, date, phone, upload'] },
  helpers: { title: 'Hooks, utils and helpers', check: ['docs/COMPONENTS.md lists them'] },
  table: { title: 'Data table, filters and command menu', check: ['/playground/table : search, sort, pages, columns, selection, export', 'narrow window: rows become cards', 'Open commands: search, arrow keys, Enter'] },
  api: { title: 'API client and login state', check: ['VITE_API_URL in .env (no backend yet: sample data, frontend-api/references/mock-data.md)', 'real addresses in src/features/auth/services/auth.service.ts', 'roles in src/config/permissions.ts'] },
  speed: { title: 'Speed: limits, images, long lists, preloading', check: ['npm run build, then npm run size'] },
};
const BLOCK_CHECKS = {
  'auth-pages': ['/login, /register, /forgot-password : look and errors', 'signing in needs the real server'],
  'account-pages': ['/profile and /settings (they need the server for data)'],
  'dark-mode': ['theme button in the navbar: light, dark, device', 'reload keeps the choice'],
  dashboard: ['/ : numbers and charts, or the error state until the server answers'],
  notifications: ['bell in the navbar, /notifications'],
  i18n: ['language button in the navbar; Arabic turns the page around'],
};
export function stepInfo(id) {
  if (STEPS[id]) return STEPS[id];
  const [kind, name] = id.split(':');
  if (kind === 'block') return { title: `Part: ${name}`, check: BLOCK_CHECKS[name] ?? ['use it on a page and try it'] };
  if (kind === 'code') return { title: `Code: ${name}`, check: [`node scripts/index-components.mjs ${name} shows its props`, 'use it on a page and try it'] };
  return { title: `Feature: ${name}`, check: [`/${name} : list, search, sort, filter`, 'create, edit, delete, required fields', `server names in src/features/${name}/services`] };
}

const blocksFile = () => path.join(sibling('frontend-blocks'), 'assets/blocks.json');
const allBlocks = () => (existsSync(blocksFile()) ? JSON.parse(text(blocksFile())) : {});
export const blockList = () => Object.entries(allBlocks()).map(([id, b]) => [id, b.about]);
/** The blocks with the ones they need, in the right order. */
export function expandBlocks(names) {
  const all = allBlocks();
  const out = [];
  const add = (name) => {
    if (!all[name]) fail(`Unknown part "${name}". Known: ${Object.keys(all).join(', ')}`);
    all[name].blocks?.forEach(add);
    if (!out.includes(name)) out.push(name);
  };
  names.forEach(add);
  return out;
}

const key = (text) => text.toLowerCase().replace(/[^a-z\d]/g, '');
const ALIASES = {
  sidebar: 'layout', navbar: 'layout', shell: 'layout', components: 'basics', common: 'basics', fields: 'forms', form: 'forms', hooks: 'helpers', utils: 'helpers',
  datatable: 'table', filters: 'table', performance: 'speed', backend: 'api',
  login: 'block:auth-pages', auth: 'block:auth-pages', register: 'block:auth-pages', otp: 'block:auth-pages', profile: 'block:account-pages', settings: 'block:account-pages',
  dark: 'block:dark-mode', theme: 'block:dark-mode', languages: 'block:i18n', translations: 'block:i18n', board: 'block:kanban', chart: 'block:charts', import: 'block:csv-import',
};

/** What a word means: a step, a ready part, a feature, or a single component, hook or util. */
export function findStep(word) {
  if (/^(feature|block|code):/.test(word)) {
    if (word.startsWith('block:')) expandBlocks([word.slice(6)]);
    return word.startsWith('feature:') ? `feature:${word.slice(8).toLowerCase().replace(/[^a-z\d]+/g, '-')}` : word;
  }
  const k = key(word);
  if (STEPS[k]) return k;
  const block = Object.keys(allBlocks()).find((b) => key(b) === k);
  if (block) return `block:${block}`;
  if (ALIASES[k]) return ALIASES[k];
  return codeFiles(word).length ? `code:${word}` : null;
}

// ---- Copying

const coreTemplate = path.join(core, 'assets/template/src');
const importsOf = (file) =>
  /\.tsx?$/.test(file) ? [...text(file).matchAll(/(?:\bfrom|\bimport\(|\bimport|vi\.mock\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]) : [];
const isLocal = (spec) => spec.startsWith('@/') || spec.startsWith('.');

/** Every place finished code can come from. */
let sources;
function roots() {
  sources ??= [
    { root: coreTemplate },
    { root: path.join(sibling('frontend-api'), 'assets/template/src') },
    { root: path.join(sibling('frontend-performance'), 'assets/template/src') },
    ...Object.keys(allBlocks()).map((block) => ({ block, root: path.join(sibling('frontend-blocks'), 'assets/blocks', block, 'src') })),
  ].filter((r) => existsSync(r.root)).map((r) => ({ ...r, files: new Set(listFiles(r.root)) }));
  return sources;
}
const candidates = (from, spec) => {
  const base = spec.startsWith('@/') ? spec.slice(2) : path.posix.join(path.posix.dirname(from), spec);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`];
};
const inProject = (project, from, spec) => candidates(from, spec).find((f) => isFile(path.join(project, 'src', f)));
function inSources(from, spec) {
  for (const file of candidates(from, spec)) {
    const source = roots().find((r) => r.files.has(file));
    if (source) return { file, source };
  }
  return null;
}

/** Copies files with everything they import. A part brings all of its files. */
function pull(project, wanted) {
  const queue = [...wanted];
  const seen = new Set();
  let added = 0;
  while (queue.length) {
    const { file, source } = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (source.block && !seen.has(`block ${source.block}`)) {
      seen.add(`block ${source.block}`);
      for (const name of expandBlocks([source.block])) {
        const other = roots().find((r) => r.block === name);
        for (const f of other.files) if (!/\.test\./.test(f)) queue.push({ file: f, source: other });
      }
    }
    for (const spec of importsOf(path.join(source.root, file)).filter(isLocal)) {
      if (inProject(project, file, spec)) continue;
      const found = inSources(file, spec);
      if (found) queue.push(found);
    }
    const target = path.join(project, 'src', file);
    if (existsSync(target)) continue;
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(source.root, file), target);
    added++;
  }
  return added;
}
const pullFiles = (project, files) =>
  pull(project, files.map((file) => ({ file, source: roots().find((r) => r.files.has(file)) })).filter((f) => f.source));
const pullPattern = (project, pattern) => pullFiles(project, [...roots()[0].files].filter((f) => pattern.test(f) && !/\.test\./.test(f)));

/** Files of one component, hook or util by its name. */
function codeFiles(word) {
  const name = word.replace(/^code:/, '');
  const k = key(name);
  const [coreRoot, , speedRoot] = roots();
  const all = [...new Set([...coreRoot.files, ...(speedRoot?.files ?? [])])].filter((f) => /\.tsx?$/.test(f) && !/\.test\.|^app\/|^test\//.test(f));
  const folder = all.filter((f) => /^components\//.test(f) && key(f.split('/').at(-2)) === k && f.endsWith('/index.ts'));
  return folder.length ? folder : all.filter((f) => key(f.split('/').at(-1).replace(/\.tsx?$/, '')) === k);
}

/** Copies what the code in the project imports but does not have yet. */
export function complete(project) {
  const src = path.join(project, 'src');
  const open = [];
  const unknown = [];
  let usesQueries = false;
  for (const file of listFiles(src).filter((f) => /\.tsx?$/.test(f))) {
    for (const spec of importsOf(path.join(src, file))) {
      if (spec === '@tanstack/react-query' && !/\.test\./.test(file)) usesQueries = true;
      if (!isLocal(spec) || inProject(project, file, spec)) continue;
      const found = inSources(file, spec);
      if (found) open.push(found);
      else unknown.push(`src/${file} imports ${spec}`);
    }
  }
  if (usesQueries && !isFile(path.join(src, 'lib/query-client.ts'))) open.push({ file: 'lib/query-client.ts', source: roots().find((r) => r.files.has('lib/query-client.ts')) });
  // Dialogs and toasts work only inside their provider.
  if (['components/shared/confirm/index.ts', 'components/ui/toast/index.ts'].some((f) => isFile(path.join(src, f)))) {
    const provider = 'app/providers/AppProviders.tsx';
    if (!isFile(path.join(src, provider))) open.push({ file: provider, source: roots()[0] });
  }
  const added = pull(project, open.filter((o) => o.source));
  // The API client needs its address.
  const example = path.join(sibling('frontend-api'), 'assets/template/.env.example');
  if (isFile(path.join(src, 'config/env.ts'))) {
    for (const name of ['.env.example', '.env']) if (!existsSync(path.join(project, name))) copyFileSync(example, path.join(project, name));
  }
  return { added, unknown };
}

/** Tests whose imports are all there now. */
function copyTests(project) {
  for (const { root, files } of roots()) {
    for (const file of files) {
      const target = path.join(project, 'src', file);
      if (!/\.test\.tsx?$/.test(file) || existsSync(target)) continue;
      if (importsOf(path.join(root, file)).filter(isLocal).every((spec) => inProject(project, file, spec))) {
        mkdirSync(path.dirname(target), { recursive: true });
        copyFileSync(path.join(root, file), target);
      }
    }
  }
}

// ---- Packages

const DEV = ['vite', '@vitejs/plugin-react', 'typescript', 'tailwindcss', '@tailwindcss/vite', '@types/node', '@types/react', '@types/react-dom',
  'eslint', '@eslint/js', 'typescript-eslint', 'globals', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'eslint-plugin-jsx-a11y-x',
  'eslint-config-prettier', 'prettier', 'prettier-plugin-tailwindcss', 'vitest', 'jsdom', '@testing-library/react', '@testing-library/dom',
  '@testing-library/jest-dom', '@testing-library/user-event'];

function install(project, notes) {
  const pkg = JSON.parse(text(path.join(project, 'package.json')));
  const have = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const used = new Set(['react', 'react-dom', '@fontsource-variable/inter']);
  for (const file of listFiles(path.join(project, 'src')).filter((f) => /\.tsx?$/.test(f) && !/(\.test\.|^test\/)/.test(f))) {
    for (const spec of importsOf(path.join(project, 'src', file))) {
      if (!isLocal(spec) && !/^(node:|virtual:)/.test(spec)) used.add(spec.split('/').slice(0, spec.startsWith('@') ? 2 : 1).join('/'));
    }
  }
  const runtime = [...used].filter((p) => !have.has(p) && p !== 'vite' && p !== 'vitest');
  const dev = DEV.filter((p) => !have.has(p));
  if (!runtime.length && !dev.length) return;
  const resolved = run(path.join(core, 'scripts/resolve-versions.mjs'), [...runtime, ...(dev.length ? ['-D', ...dev] : [])], project);
  for (const line of resolved.split('\n').filter((l) => l.includes('(latest'))) notes.push(line.replace(/\s+/g, ' ').trim());
  for (const command of resolved.split('\n').filter((l) => l.startsWith('npm install'))) {
    try {
      execSync(`${command} --no-audit --no-fund --loglevel=error`, { cwd: project, stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
    } catch (error) {
      fail(`Install failed: ${command}\n${String(error.stderr).slice(0, 1500)}`);
    }
  }
}

// ---- Setup

function writeSetup(project, o, notes) {
  run(path.join(core, 'scripts/add-to-project.mjs'), [project], project);
  copyFileSync(path.join(core, 'assets/template/eslint.config.js'), path.join(project, 'eslint.config.js'));
  const speed = path.join(sibling('frontend-performance'), 'assets/template');
  copyFileSync(path.join(speed, 'vite.performance.ts'), path.join(project, 'vite.performance.ts'));
  mkdirSync(path.join(project, 'src/styles'), { recursive: true });
  copyFileSync(path.join(speed, 'src/styles/fonts.css'), path.join(project, 'src/styles/fonts.css'));
  for (const f of ['theme.css', 'base.css']) copyFileSync(path.join(coreTemplate, 'styles', f), path.join(project, 'src/styles', f));
  pullPattern(project, /^(lib\/cn\.ts|config\/(app\.config|routes)\.ts|constants\/ui-text\.ts|test\/setup\.ts)$/);

  write(project, 'package.json', JSON.stringify({
    name: o.name, private: true, version: '0.1.0', type: 'module',
    scripts: {
      dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview', typecheck: 'tsc --noEmit', lint: 'eslint .',
      test: 'vitest run --passWithNoTests', format: 'prettier --write src', verify: 'node scripts/verify.mjs', size: 'node scripts/performance/check-size.mjs',
      measure: 'node scripts/performance/measure.mjs', index: 'node scripts/index-components.mjs',
    },
  }, null, 2));
  write(project, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2023', lib: ['ES2023', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx',
      strict: true, noUncheckedIndexedAccess: true, noUnusedLocals: true, noUnusedParameters: true, noFallthroughCasesInSwitch: true,
      verbatimModuleSyntax: true, isolatedModules: true, resolveJsonModule: true, skipLibCheck: true, noEmit: true,
      types: ['vite/client', 'vitest/globals', '@testing-library/jest-dom'], paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
  }, null, 2));
  write(project, 'vite.config.ts', `
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { performanceBuild } from './vite.performance.ts';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: performanceBuild,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    testTimeout: 30_000,
    env: { VITE_API_URL: 'http://localhost/api' },
  },
});
`);
  write(project, '.prettierrc', JSON.stringify({ singleQuote: true, printWidth: 120, plugins: ['prettier-plugin-tailwindcss'] }, null, 2));
  write(project, '.gitignore', 'node_modules\ndist\ncoverage\n*.log\n.DS_Store\n.env\n.env.*\n!.env.example');
  write(project, 'public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${o.color}"/><text x="16" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#fff">${(/[\p{L}\d]/u.exec(o.title)?.[0] ?? 'A').toUpperCase()}</text></svg>`);
  write(project, 'README.md', `# ${o.title}\n\n\`\`\`bash\nnpm run dev      # start\nnpm run verify   # every check, short output\nnpm run build\n\`\`\`\n\nWhat is built: \`docs/PROGRESS.md\`. Components: \`/playground\` while developing. Rules for people and AI tools: \`AGENTS.md\`.`);

  o.primary = applyColor(project, o.color, notes);
  const quoted = `'${o.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  edit(project, 'src/config/app.config.ts', ["name: 'My app'", `name: ${quoted}`], ["locale: 'en-US'", `locale: '${o.locale}'`], ["currency: 'USD'", `currency: '${o.currency}'`], ["country: 'US'", `country: '${o.country}'`]);
  const routes = path.join(project, 'src/config/routes.ts');
  writeFileSync(routes, text(routes).replace(/  users: \{[\s\S]*?\n  \},\n/, ''));
  edit(project, 'AGENTS.md', ['{{PROJECT_NAME}}', o.title], ['{{ONE_LINE_PURPOSE}}\n\n', ''], ['{{LIGHT_OR_BOTH}}', o.dark ? 'light and dark' : 'light only'], ['{{SIDEBAR_OR_NAVBAR}}', o.layout], ['{{MODULES}}', 'add them here']);
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, part) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * part));
const light = (h) => rgb(h).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(light(a), light(b)) + 0.05) / (Math.min(light(a), light(b)) + 0.05);

function applyColor(project, color, notes) {
  let primary = color.toLowerCase();
  // Links and buttons must stay readable on every surface, so a light color gets darker.
  while (Math.min(contrast(primary, '#ffffff'), contrast(primary, '#f1f5f9')) < 4.5) primary = mix(primary, '#000000', 0.06);
  if (primary !== color.toLowerCase()) notes.push(`color ${color} is too light for text, so ${primary} is used`);
  let subtle = mix(primary, '#ffffff', 0.92);
  while (contrast(primary, subtle) < 4.5) subtle = mix(subtle, '#ffffff', 0.3);
  const values = { primary, 'primary-hover': mix(primary, '#000000', 0.2), 'primary-subtle': subtle, 'on-primary': '#ffffff', focus: primary };
  edit(project, 'src/styles/theme.css', ...Object.entries(values).map(([key, value]) => [new RegExp(`--color-${key}: #[\\da-f]{6};`, 'i'), `--color-${key}: ${value};`]));
  return primary;
}
function applyDarkColor(project, primary) {
  if (primary === '#2563eb') return;
  let pale = primary;
  while (Math.min(...['#0f172a', '#1e293b', '#273449'].map((s) => contrast(pale, s))) < 4.6) pale = mix(pale, '#ffffff', 0.08);
  edit(project, 'src/styles/dark.css', [/--color-primary: #[\da-f]{6};/i, `--color-primary: ${pale};`], [/--color-primary-hover: #[\da-f]{6};/i, `--color-primary-hover: ${mix(pale, '#ffffff', 0.25)};`],
    [/--color-primary-subtle: #[\da-f]{6};/i, `--color-primary-subtle: ${mix('#1e293b', pale, 0.08)};`], [/--color-focus: #[\da-f]{6};/i, `--color-focus: ${mix(pale, '#ffffff', 0.25)};`]);
}

// ---- Files that connect the parts. Written again after each step, unless somebody
// changed them by hand; lines of generated features are kept.

const FEATURE_LINE = /^\s*\.\.\.\w+Routes,$/;
const FEATURE_IMPORT = /^import \{ \w+Routes \} from '@\/features\/[^']+';$/;
const MENU_LINE = /^\s*\{ id: .*to: ROUTES\.\w+\.list\b.*\},$/;
const ICONS = /^import \{ ([^}]*) \} from '@phosphor-icons\/react';$/;
const own = (line) => !FEATURE_LINE.test(line) && !FEATURE_IMPORT.test(line) && !MENU_LINE.test(line) && !ICONS.test(line);
const hash = (content) => createHash('sha1').update(content.split('\n').filter(own).join('\n').trim()).digest('hex').slice(0, 12);

function keepFeatures(next, before) {
  const old = before.split('\n');
  let lines = next.split('\n');
  const inside = old.filter((l) => FEATURE_LINE.test(l) || MENU_LINE.test(l)).filter((l) => !lines.some((n) => n.trim() === l.trim()));
  const marker = lines.findIndex((l) => l.trim() === '// features');
  const indent = /^\s*/.exec(lines[marker] ?? '')[0];
  if (marker >= 0) lines.splice(marker, 0, ...inside.map((l) => indent + l.trim()));
  // Imports only where the features are listed.
  const imports = marker < 0 ? [] : old.filter((l) => FEATURE_IMPORT.test(l) && !lines.includes(l));
  const last = lines.findLastIndex((l) => /^import .*;$/.test(l));
  lines.splice(last + 1, 0, ...imports);
  // Icons chosen for menu items stay imported.
  const names = old.map((l) => ICONS.exec(l)?.[1]).find(Boolean)?.split(', ') ?? [];
  lines = lines.map((l) => {
    const now = ICONS.exec(l)?.[1].split(', ');
    if (!now) return l;
    const body = lines.join('\n');
    return `import { ${[...new Set([...now, ...names.filter((n) => new RegExp(`icon: ${n}\\b`).test(body))])].sort().join(', ')} } from '@phosphor-icons/react';`;
  });
  return lines.join('\n');
}

function managed(project, state, todo, file, content) {
  const full = path.join(project, file);
  const next = `${content.replace(/^\n/, '').trimEnd()}\n`;
  if (existsSync(full)) {
    const now = text(full);
    // Nothing new to write, also when somebody changed the file.
    if (hash(now) === hash(next) || state.hashes[file] === hash(next)) return;
    if (state.hashes[file] !== hash(now)) {
      write(project, `docs/proposed/${path.basename(file)}`, next);
      todo.push(`${file} was changed by hand: merge docs/proposed/${path.basename(file)} into it, then delete that file`);
      return;
    }
    writeFileSync(full, keepFeatures(next, now));
  } else {
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, next);
  }
  state.hashes[file] = hash(next);
}

function writeApp(project, state, todo) {
  const o = state.options;
  const has = (file) => existsSync(path.join(project, 'src', file));
  const put = (file, content) => managed(project, state, todo, file, content);
  const layout = has('app/layouts/AppLayout.tsx');
  // Every component that uses queries must be inside the query provider.
  const api = has('lib/query-client.ts') || listFiles(path.join(project, 'src')).some((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f) && importsOf(path.join(project, 'src', f)).includes('@tanstack/react-query'));
  const authPages = has('features/auth/pages/LoginPage.tsx');
  const account = has('features/account/pages/ProfilePage.tsx');
  const dashboard = has('features/dashboard/pages/DashboardPage.tsx');
  const dark = has('hooks/useTheme.ts');
  const bell = has('features/notifications/components/NotificationBell.tsx');
  const i18n = has('lib/i18n.ts');
  const speed = has('lib/preload-routes.ts');
  const navbarOnly = o.layout === 'navbar';

  put('index.html', `
<!doctype html>
<html lang="${o.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${o.title.replace(/[<&"]/g, '')}" />
    <meta name="theme-color" content="${o.color}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>${o.title.replace(/[<&]/g, '')}</title>${dark ? `
    <script>
      try {
        var t = localStorage.getItem('theme');
        var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      } catch (e) { /* stays light */ }
    </script>` : ''}
  </head>
  <body>
    <noscript>This app needs JavaScript. Turn it on and reload the page.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
  put('src/styles/index.css', `@import 'tailwindcss';\n@import './fonts.css';\n@import './theme.css';\n${dark ? "@import './dark.css';\n" : ''}${has('styles/charts.css') ? "@import './charts.css';\n" : ''}@import './base.css';`);
  if (layout) put('src/config/navigation.ts', `
import { ${[...(account ? ['GearSixIcon'] : []), 'SquaresFourIcon'].join(', ')} } from '@phosphor-icons/react';
import type { NavGroup } from '@/components/layout/navigation';
import { ROUTES } from './routes';

// Sidebar, mobile menu and breadcrumbs read this.
export const APP_NAV: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Dashboard', to: ROUTES.home, icon: SquaresFourIcon, exact: true },
      // features
    ],
  },${account ? `
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', to: ROUTES.settings, icon: GearSixIcon }],
  },` : ''}
];
`);
  if (!dashboard) put('src/app/pages/HomePage.tsx', layout ? `
import { LayoutDashboard } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { EmptyState } from '@/components/shared/states';

export function HomePage() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" />
      <EmptyState icon={LayoutDashboard} title="Nothing here yet" description="Add the first feature to this page." />
    </PageContainer>
  );
}
` : `
import { appConfig } from '@/config/app.config';

export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center">
      <title>{appConfig.name}</title>
      <h1 className="text-2xl font-semibold text-primary">{appConfig.name}</h1>
      <p className="text-muted">The project runs. The layout comes next.</p>
    </main>
  );
}
`);

  if (layout) {
    const right = [...(i18n ? ['<LanguageMenu />'] : []), ...(dark ? ['<ThemeMenu />'] : []), ...(bell ? ['<NotificationBell />'] : [])];
    if (authPages) right.push(`{user && (
              <UserMenu
                user={user}${account ? "\n                items={[{ label: 'Profile', icon: User, onSelect: () => void navigate(ROUTES.profile) }]}" : ''}
                onSignOut={() => void signOut().catch(() => undefined)}
              />
            )}`);
    const header = '<AppLogo />';
    const routerNames = [...(navbarOnly ? ['NavLink', 'Outlet'] : []), ...(authPages && account ? ['useNavigate'] : [])];
    put('src/app/layouts/AppShell.tsx', [
      ...(authPages && account ? ["import { User } from 'lucide-react';"] : []),
      ...(navbarOnly ? ["import { Suspense } from 'react';"] : []),
      ...(routerNames.length ? [`import { ${routerNames.join(', ')} } from 'react-router-dom';`] : []),
      ...(navbarOnly
        ? ["import { AppLogo } from '@/components/layout/logo';", `import { Navbar${authPages ? ', UserMenu' : ''} } from '@/components/layout/navbar';`, "import { SidebarProvider } from '@/components/layout/sidebar';", "import { ErrorBoundary } from '@/components/shared/error-boundary';", "import { OfflineBanner } from '@/components/shared/states';", "import { SectionLoader } from '@/components/ui/loader';"]
        : authPages ? ["import { UserMenu } from '@/components/layout/navbar';"] : []),
      ...(i18n ? ["import { LanguageMenu } from '@/components/shared/language';"] : []),
      ...(dark ? ["import { ThemeMenu } from '@/components/shared/theme';"] : []),
      "import { APP_NAV } from '@/config/navigation';",
      ...(authPages ? ["import type { Permission } from '@/config/permissions';"] : []),
      ...(authPages && account ? ["import { ROUTES } from '@/config/routes';"] : []),
      ...(navbarOnly ? ["import { uiText } from '@/constants/ui-text';"] : []),
      ...(authPages ? ["import { useAuth, usePermission } from '@/features/auth';"] : []),
      ...(bell ? ["import { NotificationBell } from '@/features/notifications/components/NotificationBell';"] : []),
      ...(navbarOnly ? ["import { cn } from '@/lib/cn';"] : ["import { AppLayout } from './AppLayout';"]),
      '',
      '/** The frame around every page: menu, navbar, account. */',
      'export function AppShell() {',
      ...(authPages ? ['  const { user, signOut } = useAuth();', '  const { can } = usePermission();'] : []),
      ...(authPages && account ? ['  const navigate = useNavigate();'] : []),
      ...(navbarOnly
        ? [`  const items = APP_NAV.flatMap((g) => g.items).filter((i) => i.to${authPages ? ' && (!i.permission || can(i.permission as Permission))' : ''});
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-(--z-tooltip) focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:outline-2 focus:outline-focus"
      >
        {uiText.skip}
      </a>
      <div className="flex min-h-dvh flex-col">
        <OfflineBanner />
        <Navbar
          left={${header}}
          center={
            <nav aria-label={uiText.mainMenu} className="flex gap-1 overflow-x-auto">
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to ?? '/'}
                  end={!!item.exact}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-control items-center rounded-md px-3 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus',
                      isActive ? 'bg-primary-subtle font-medium text-primary' : 'hover:bg-subtle',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          }${right.length ? `
          right={
            <>
            ${right.join('\n            ')}
            </>
          }` : ''}
        />
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
          <ErrorBoundary>
            <Suspense fallback={<SectionLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </SidebarProvider>
  );`]
        : [`  return (
    <AppLayout
      nav={APP_NAV}${authPages ? '\n      can={(permission) => can(permission as Permission)}' : ''}${right.length ? `
      navbar={{
        right: (
          <>
            ${right.join('\n            ')}
          </>
        ),
      }}` : ''}
    />
  );`]),
      '}',
    ].join('\n'));
  }

  const page = (key, module, name) => `{ path: ROUTES.${key}, lazy: async () => ({ Component: (await import('${module}')).${name} }) },`;
  const playgrounds = [['/playground', 'BasicsPlayground'], ['/playground/fields', 'FieldsPlayground'], ['/playground/table', 'TablePlayground']].filter(([, name]) => has(`app/pages/${name}.tsx`));
  const inside = [
    dashboard ? page('home', '@/features/dashboard/pages/DashboardPage', 'DashboardPage') : page('home', '@/app/pages/HomePage', 'HomePage'),
    ...(account ? [page('profile', '@/features/account/pages/ProfilePage', 'ProfilePage'), page('settings', '@/features/account/pages/SettingsPage', 'SettingsPage')] : []),
    ...(bell ? [page('notifications', '@/features/notifications/pages/NotificationsPage', 'NotificationsPage')] : []),
    '// features',
    ...(playgrounds.length ? [`...(import.meta.env.DEV`, '  ? [', ...playgrounds.map(([at, name]) => `      { path: '${at}', lazy: async () => ({ Component: (await import('@/app/pages/${name}')).${name} }) },`), '    ]', '  : []),'] : []),
    ...(layout ? ["{ path: '*', element: <NotFoundPage /> },"] : []),
  ];
  const guests = [['login', 'LoginPage'], ['register', 'RegisterPage'], ['verifyEmail', 'VerifyEmailPage'], ['forgotPassword', 'ForgotPasswordPage'], ['resetPassword', 'ResetPasswordPage']]
    .map(([key, name]) => page(key, `@/features/auth/pages/${name}`, name));
  const loader = has('components/ui/loader/Loaders.tsx');
  const status = has('app/pages/StatusPages.tsx');
  const featureLines = (content) => content.split('\n').filter((l) => FEATURE_LINE.test(l) || FEATURE_IMPORT.test(l));

  // Pages inside the frame. generate.mjs adds features above "// features".
  let appRoutes = [
    "import type { RouteObject } from 'react-router-dom';",
    ...(layout ? ["import { NotFoundPage } from '@/app/pages/StatusPages';"] : []),
    "import { ROUTES } from '@/config/routes';",
    '',
    '/** Pages inside the sidebar and navbar. Every page is loaded on demand. */',
    'export const appRoutes: RouteObject[] = [',
    ...inside.map((l) => `  ${l}`),
    '];',
  ].join('\n');
  // Projects from before the router folder: their features move here.
  const oldRouter = path.join(project, 'src/app/router/router.tsx');
  if (!has('app/router/app.routes.tsx') && existsSync(oldRouter) && featureLines(text(oldRouter)).length) appRoutes = keepFeatures(appRoutes, text(oldRouter));
  put('src/app/router/app.routes.tsx', appRoutes);
  if (authPages) put('src/app/router/auth.routes.tsx', [
    "import type { RouteObject } from 'react-router-dom';",
    "import { ROUTES } from '@/config/routes';",
    '',
    '/** Login and the other pages for people who are not signed in. */',
    'export const authRoutes: RouteObject[] = [',
    ...guests.map((l) => `  ${l}`),
    '];',
  ].join('\n'));

  const frame = layout ? ['{', '  element: <AppShell />,', '  children: appRoutes,', '},'] : ['...appRoutes,'];
  put('src/app/router/routes.tsx', [
    "import type { RouteObject } from 'react-router-dom';",
    ...(layout ? ["import { AppShell } from '@/app/layouts/AppShell';"] : []),
    ...(authPages ? ["import { AuthLayout } from '@/app/layouts/AuthLayout';"] : []),
    ...(status ? ["import { RouteErrorPage } from '@/app/pages/StatusPages';"] : []),
    ...(loader ? ["import { PageLoader } from '@/components/ui/loader';"] : []),
    ...(authPages ? ["import { ROUTES } from '@/config/routes';", "import { GuestRoute, ProtectedRoute } from '@/features/auth';"] : []),
    "import { appRoutes } from './app.routes';",
    ...(authPages ? ["import { authRoutes } from './auth.routes';"] : []),
    '',
    '/** The whole tree: who may open what, and which frame is around it. */',
    'export const routes: RouteObject[] = [',
    '  {',
    `    HydrateFallback: ${loader ? 'PageLoader' : '() => null'},`,
    ...(status ? ['    errorElement: <RouteErrorPage />,'] : []),
    '    children: [',
    ...(authPages ? [
      '      {',
      '        element: <GuestRoute loader={<PageLoader />} />,',
      '        children: [{ element: <AuthLayout />, children: authRoutes }],',
      '      },',
      '      {',
      '        element: <ProtectedRoute loader={<PageLoader />} loginPath={ROUTES.login} />,',
      '        children: [',
      ...frame.map((l) => `          ${l}`),
      '        ],',
      '      },',
    ] : frame.map((l) => `      ${l}`)),
    '    ],',
    '  },',
    '];',
  ].join('\n'));
  put('src/app/router/router.tsx', [
    "import { createBrowserRouter } from 'react-router-dom';",
    "import { routes } from './routes';",
    '',
    'export { routes };',
    'export const router = createBrowserRouter(routes);',
  ].join('\n'));

  const providers = has('app/providers/AppProviders.tsx');
  put('src/app/App.tsx', [
    ...(api ? ["import { QueryClientProvider } from '@tanstack/react-query';"] : []),
    "import { RouterProvider } from 'react-router-dom';",
    ...(providers ? ["import { AppProviders } from '@/app/providers/AppProviders';"] : []),
    "import { router } from '@/app/router/router';",
    ...(authPages ? ["import { AuthProvider } from '@/features/auth';"] : []),
    ...(dark ? ["import { useApplyTheme } from '@/hooks/useTheme';"] : []),
    ...(api ? ["import { queryClient } from '@/lib/query-client';"] : []),
    '',
    'export function App() {',
    ...(dark ? ['  useApplyTheme();'] : []),
    '  return (',
    ...[
      ...(api ? ['<QueryClientProvider client={queryClient}>'] : []),
      ...(authPages ? ['<AuthProvider>'] : []),
      ...(providers ? ['<AppProviders>'] : []),
    ].map((l, i) => `    ${'  '.repeat(i)}${l}`),
    `    ${'  '.repeat(Number(api) + Number(authPages) + Number(providers))}<RouterProvider router={router} />`,
    ...[
      ...(providers ? ['</AppProviders>'] : []),
      ...(authPages ? ['</AuthProvider>'] : []),
      ...(api ? ['</QueryClientProvider>'] : []),
    ].map((l, i, all) => `    ${'  '.repeat(all.length - 1 - i)}${l}`),
    '  );',
    '}',
  ].join('\n'));

  // Catches a missing provider ("No QueryClient set") before the browser does.
  put('src/app/App.test.tsx', `
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { App } from './App';

it('starts without an error', async () => {
  window.matchMedia ??= vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render(<App />);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(screen.queryByText(/Unexpected Application Error|Something went wrong/)).toBeNull();
  expect(errors.mock.calls.flat().join(' ')).not.toMatch(/No QueryClient|must be used within|needs \\w+Provider/i);
  errors.mockRestore();
});
`);

  const late = speed && layout;
  const modules = [["{ App }", '@/app/App'], ...(late ? [['{ router, routes }', '@/app/router/router'], ['{ toast }', '@/components/ui/toast'], ['{ preloadOnIntent }', '@/lib/preload-routes'], ['{ recoverFromStaleDeploy }', '@/lib/stale-deploy']] : [])];
  put('src/main.tsx', [
    "import '@fontsource-variable/inter';",
    "import '@/styles/index.css';",
    "import { StrictMode } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    ...(i18n ? ["import { startI18n } from '@/lib/i18n';"] : modules.map(([names, from]) => `import ${names} from '${from}';`)),
    '',
    "const root = document.getElementById('root');",
    "if (!root) throw new Error('index.html has no #root');",
    '',
    ...(i18n ? [
      '// The language first, because constants read their texts while loading.',
      'await startI18n();',
      `const [${modules.map(([names]) => names).join(', ')}] = await Promise.all([`,
      ...modules.map(([, from]) => `  import('${from}'),`),
      ']);',
      '',
    ] : []),
    ...(late ? [
      'preloadOnIntent(routes);',
      'recoverFromStaleDeploy(router, () =>',
      "  toast.info('A new version is available', { id: 'new-version', action: { label: 'Reload', onClick: () => location.reload() } }),",
      ');',
    ] : []),
    'createRoot(root).render(',
    '  <StrictMode>',
    '    <App />',
    '  </StrictMode>,',
    ');',
  ].join('\n'));
}

// ---- Building one step

const PATTERNS = {
  layout: /^(app\/(layouts|providers)\/|app\/pages\/StatusPages|components\/layout\/)/,
  basics: /^(components\/ui\/(?!fields\/)|components\/shared\/(confirm|states|error-boundary)\/|app\/pages\/BasicsPlayground)/,
  forms: /^(components\/ui\/fields\/|components\/form\/|app\/pages\/FieldsPlayground)/,
  helpers: /^(hooks|utils|lib)\//,
  table: /^(components\/shared\/(data-table|command-menu)\/|app\/pages\/TablePlayground)/,
};

/** Builds exactly one thing. Returns what is left for the AI or developer. */
export function buildStep(project, state, id, { installPackages = true, fields, singular } = {}) {
  const o = state.options;
  const notes = [];
  const todo = [];
  const [kind, name] = id.split(':');
  const wasDark = existsSync(path.join(project, 'src/styles/dark.css'));
  if (id === 'setup') writeSetup(project, o, notes);
  else if (PATTERNS[id]) pullPattern(project, PATTERNS[id]);
  else if (id === 'api') run(path.join(sibling('frontend-api'), 'scripts/add-to-project.mjs'), [project], project);
  else if (id === 'speed') run(path.join(sibling('frontend-performance'), 'scripts/add-to-project.mjs'), [project], project);
  else if (kind === 'code') pullFiles(project, codeFiles(name));
  else if (kind === 'block') {
    const source = roots().find((r) => r.block === name);
    pullFiles(project, [...source.files].filter((f) => !/\.test\./.test(f)));
    // Some are connected below; the others need a place on a page.
    const connected = ['auth-pages', 'account-pages', 'dashboard', 'dark-mode', 'notifications', 'i18n', 'charts'];
    const hint = allBlocks()[name].next;
    if (hint && !connected.includes(name)) todo.push(hint);
  } else if (kind === 'feature') {
    pullFiles(project, ['services/api.ts', 'types/api.types.ts']);
    run(path.join(core, 'scripts/generate.mjs'), ['feature', name, '--project', project, '--fields', fields, ...(singular ? ['--singular', singular] : [])], project);
  }
  // What depends on the project is written by the AI, as the references say.
  if (id === 'layout') todo.push('menu: plan it from their project and write src/config/navigation.ts and check the layout against references/layout-spec.md');
  if (kind === 'feature' && !existsSync(path.join(project, 'src/mocks'))) todo.push('no backend given? sample data for this feature as frontend-api/references/mock-data.md says');
  // Twice: the connecting files can need more, and more can need a provider.
  complete(project);
  complete(project);
  writeApp(project, state, todo);
  complete(project);
  const { unknown } = complete(project);
  // Again, so files copied last are connected too.
  writeApp(project, state, todo);
  todo.push(...unknown);
  if (!wasDark && existsSync(path.join(project, 'src/styles/dark.css'))) applyDarkColor(project, o.primary);
  copyTests(project);
  if (installPackages) install(project, notes);
  run(path.join(core, 'scripts/index-components.mjs'), [project], project);
  return { notes, todo };
}

/** Finishes what somebody wrote: missing files and packages. */
export function finish(project, state, { installPackages = true } = {}) {
  const notes = [];
  const todo = [];
  const { added } = complete(project);
  complete(project);
  writeApp(project, state, todo);
  todo.push(...complete(project).unknown);
  writeApp(project, state, todo);
  copyTests(project);
  if (installPackages) install(project, notes);
  run(path.join(core, 'scripts/index-components.mjs'), [project], project);
  return { added, notes, todo };
}
