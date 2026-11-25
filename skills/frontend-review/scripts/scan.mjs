#!/usr/bin/env node
// Finds mechanical problems against the FrontendCore standards. Changes nothing.
//
//   node scan.mjs <project> [file-or-folder ...] [--all]
//
// To accept a line on purpose, put "scan-ok: reason" in a comment on it or on
// the line above.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const project = path.resolve(process.argv[2] ?? '.');
if (!existsSync(project)) {
  console.error('Usage: node scan.mjs <project> [file-or-folder ...]');
  process.exit(2);
}
const showAll = process.argv.includes('--all');
const only = process.argv.slice(3).filter((a) => a !== '--all').map((p) => path.resolve(project, p));
const missing = only.filter((p) => !existsSync(p));
if (missing.length) {
  console.error(`Not found: ${missing.join(', ')}`);
  process.exit(2);
}

const inUi = (f) => /(^|\/)components\/(ui|form)\//.test(f);
const isApi = (f) => /(^|\/)services\/(api|upload)/.test(f);
const isTest = (f) => /(\.(test|spec)\.|(^|\/)(test|tests|__tests__|e2e)\/)/.test(f);

const heavy = [
  'recharts', 'chart.js', 'react-chartjs-2', 'echarts', 'echarts-for-react', 'apexcharts', 'react-apexcharts', '@nivo/', 'd3', 'three',
  '@react-three/', 'monaco-editor', '@monaco-editor/', 'codemirror', '@uiw/react-codemirror', 'quill', 'react-quill',
  '@tiptap/', '@tinymce/', '@ckeditor/', 'mapbox-gl', 'maplibre-gl', 'react-map-gl', 'leaflet', 'react-leaflet',
  '@react-google-maps/api', 'xlsx', 'exceljs', 'jspdf', 'pdfjs-dist', 'react-pdf', '@react-pdf/renderer',
  'html2canvas', 'highlight.js', 'prismjs', 'react-syntax-highlighter', '@fullcalendar/', 'react-player', 'video.js',
  'lottie-web', 'lottie-react',
];
/** Every useEffect with its body. */
const effectsIn = (file) => {
  const found = [];
  for (const match of file.matchAll(/useEffect\(\s*(?:async\s*)?\(\)\s*=>\s*/g)) {
    let at = match.index + match[0].length;
    const block = file[at] === '{';
    let depth = 0;
    let end = at;
    for (; end < file.length; end++) {
      const c = file[end];
      if ('({['.includes(c)) depth++;
      else if (')}]'.includes(c)) {
        depth--;
        if (block && depth === 0) break;
        if (!block && depth < 0) break;
      } else if (!block && c === ',' && depth === 0) break;
    }
    found.push({ index: match.index, body: file.slice(block ? at + 1 : at, end) });
  }
  return found;
};
const isHeavy = (line) => {
  const from = /^import (?!type).*from ['"]([^'"]+)['"]/.exec(line)?.[1];
  return !!from && heavy.some((h) => from === h || from.startsWith(h.endsWith('/') ? h : h + '/'));
};

// `tag` rules look at one whole JSX opening tag, also over several lines.
// `needs` rules look at a whole file: `has` without `lacks`. `files`: which files, normally code.
const rules = [
  { level: 'High', name: 'native picker element', fix: 'Dropdown, MultiDropdown or Combobox', tag: /^(select|datalist)$/ },
  { level: 'High', name: 'native date/time/color input', fix: 'DatePicker, TimePicker, MonthPicker or ColorPicker', tag: /^input$/, has: /\btype=["'{`\s]*(date|time|month|week|datetime-local|color)["'}`]/ },
  { level: 'High', name: 'browser dialog', fix: 'useConfirm, Modal or toast', line: /(?<![\w.])(?:window\.)?(?:alert|confirm|prompt)\(\s*(?:['"`]|\w+\.message)/ },
  { level: 'High', name: 'unsafe HTML', fix: 'render as text, or sanitize and note it', line: /dangerouslySetInnerHTML|\.innerHTML\s*=/ },
  { level: 'High', name: 'token in browser storage', fix: 'memory plus httpOnly cookie', line: /(?:local|session)Storage\.setItem\([^)]*(?:token|jwt|secret)/i },
  { level: 'High', name: 'eval', fix: 'remove', line: /\beval\(|new Function\(/ },
  { level: 'High', name: 'secret in public variable', fix: 'move to the server', line: /VITE_\w*(?:SECRET|PASSWORD|PRIVATE)\w*/ },
  { level: 'High', name: 'image without alt', fix: 'alt text, or alt="" if decorative', tag: /^img$/, lacks: /\balt\b|\{\.\.\./ },
  { level: 'High', name: 'click on a non-interactive element', fix: 'button or link', tag: /^(div|span|li|p|td|tr)$/, has: /\bonClick=/, lacks: /\brole=|\{\.\.\.|aria-hidden/ },
  { level: 'High', name: 'new tab without rel', fix: 'rel="noopener noreferrer"', tag: /^a$/, has: /target=["'{]+_blank/, lacks: /\brel=/ },
  { level: 'High', name: 'visible focus removed', fix: 'focus-visible outline', tag: /^(button|a)$/, has: /outline-none/, lacks: /focus-visible|focus:|role=["']combobox/ },
  { level: 'Medium', name: 'raw form control', fix: 'shared field component', tag: /^(input|textarea)$/, lacks: /type=["'](hidden|submit)/, skip: inUi },
  { level: 'Medium', name: 'raw button', fix: 'Button or IconButton', tag: /^button$/, skip: (f) => inUi(f) || /components\/(layout|shared)\//.test(f) },
  { level: 'Medium', name: 'hardcoded color class', fix: 'token class such as bg-surface', line: /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|placeholder)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/ },
  { level: 'Medium', name: 'arbitrary color', fix: 'token in theme.css', line: /-\[(?:#|rgb|hsl|oklch)/ },
  { level: 'Medium', name: 'inline color', fix: 'token class', line: /(?:color|background|backgroundColor|borderColor):\s*['"`](?:#|rgb|hsl)/ },
  { level: 'Medium', name: 'shadow', fix: 'border', line: /(?<![\w-])(?:drop-)?shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl|inner|\[))?(?=[\s"'`\]])/, inClass: true },
  { level: 'Medium', name: 'other border radius', fix: 'rounded-md', line: /(?<![\w-])rounded-(?:(?:[trbl]|tl|tr|bl|br|s|e)-)?(?:none|xs|sm|lg|xl|2xl|3xl|4xl|\[)/ },
  { level: 'Medium', name: 'request outside the API client', fix: 'feature service with api', line: /(?<![\w.])fetch\(|\baxios\b|new XMLHttpRequest/, skip: isApi },
  { level: 'Medium', name: 'any type', fix: 'real type or unknown', line: /(?::\s*|\bas\s+|<)any\b(?!\w)/, noComment: true },
  { level: 'Medium', name: 'type check disabled', fix: 'fix the type', line: /@ts-(?:ignore|nocheck)/ },
  { level: 'Medium', name: 'dark: class', fix: 'change tokens, not components', line: /(?<![\w-])dark:(?=[\w[-])/, skip: () => false },
  { level: 'High', name: 'code left out', fix: 'write the missing code', line: /(?:\/\/|\/\*|\{\/\*)\s*\.{3}\s*(?:rest|existing|other|same|remaining|your|more)\b|(?:rest of (?:the|your) (?:code|component|file)|implementation (?:here|goes here)|existing code (?:here|stays)|add your (?:logic|code) here)/i, comments: true },
  { level: 'High', name: 'failure hidden', fix: 'handle it, or say in a comment why it can be ignored', line: /catch\s*(?:\([^)]*\))?\s*\{\s*\}|\.catch\(\(\w*\)\s*=>\s*\{\s*\}\)/ },
  { level: 'High', name: 'request in an effect', fix: 'useQuery', effect: /\b(?:fetch|axios|api\.(?:get|post|put|patch|delete)|\w+Service\.\w+)\(/, skip: (f) => /Provider\.tsx$/.test(f) },
  { level: 'Medium', name: 'effect that only computes', fix: 'compute while rendering', effect: /^\s*\{?\s*set[A-Z]\w*\([^;]*\);?\s*\}?\s*$/ },
  { level: 'Medium', name: 'async effect', fix: 'an async function inside, with a cleanup', line: /useEffect\(\s*async\b/ },
  { level: 'Medium', name: 'fake data', fix: 'the real service, or an empty state', line: /\b(?:lorem ipsum|john doe|jane doe|jane smith|john smith|foo@bar|test@test|example user)\b|jsonplaceholder|reqres\.in|fakestoreapi|dummyjson|picsum\.photos|via\.placeholder|placehold\.co|randomuser\.me|\b(?:mock|dummy|fake|sample)(?:Data|Users?|Items?|Products?|Response|Api)\b/i, skip: (f) => /Playground/.test(f) },
  { level: 'Medium', name: 'fake waiting', fix: 'the real request', line: /new Promise\(\s*\(?(\w+)\)?\s*=>\s*setTimeout\(\s*\1\b/, skip: (f) => /Playground|retry|lib\/lazy/.test(f) },
  { level: 'Medium', name: 'button that does nothing', fix: 'the real action, or remove it', line: /on(?:Click|Submit|Select|Change)=\{\(\w*\)\s*=>\s*(?:\{\s*\}|undefined|null|console\.\w+\([^)]*\))\}|href=["']#["']/, skip: (f) => /Playground/.test(f) },
  { level: 'Medium', name: 'random or time value while rendering', fix: 'useId, or create it in an event', line: /\bkey=\{[^}]*(?:Math\.random|Date\.now|crypto\.randomUUID|uuid)\(|\bid=\{[^}]*Math\.random\(/ },
  { level: 'Medium', name: 'prop copied into state', fix: 'use the prop, or a key on the component', line: /useState(?:<[^>]*>)?\(\s*props\.\w+\s*\)/ },
  { level: 'Medium', name: 'query data copied into state', fix: 'use the data directly', line: /set[A-Z]\w*\(\s*(?:query|data|\w+Query|\w+\.data)(?:\.data)?(?:\?\.\w+)?\s*\)/, effectOnly: true },
  { level: 'Medium', name: 'listener without cleanup', fix: 'removeEventListener or an abort signal in the effect cleanup', needs: { has: /\baddEventListener\(/, lacks: /removeEventListener|\bsignal\b|once: true/ } },
  { level: 'Medium', name: 'interval without cleanup', fix: 'clearInterval in the effect cleanup', needs: { has: /\bsetInterval\(/, lacks: /clearInterval/ } },
  { level: 'Medium', name: 'observer without cleanup', fix: 'disconnect in the effect cleanup', needs: { has: /new (?:Intersection|Resize|Mutation|Performance)Observer\(/, lacks: /\.(?:disconnect|unobserve)\(/ } },
  { level: 'Medium', name: 'connection or worker without cleanup', fix: 'close or terminate in the effect cleanup', needs: { has: /new (?:WebSocket|EventSource|BroadcastChannel|Worker)\(/, lacks: /\.(?:close|terminate)\(/ } },
  { level: 'Medium', name: 'file URL never released', fix: 'URL.revokeObjectURL', needs: { has: /createObjectURL\(/, lacks: /revokeObjectURL/ } },
  { level: 'Medium', name: 'image without size', fix: 'Image, or width and height', tag: /^img$/, lacks: /\b(?:width|height)=|\bsize-|\b[hw]-|\{\.\.\./ },
  { level: 'Medium', name: 'whole library imported', fix: 'single functions, or plain JavaScript', line: /from ['"](?:lodash|moment|underscore|@mui\/icons-material|react-icons)['"]|import \* as \w+ from ['"](?:lucide-react|lodash|date-fns|@mui\/[\w-]+|react-icons[\w/-]*)['"]|import \{[^}]*\bicons\b[^}]*\} from ['"]lucide-react/ },
  { level: 'Medium', name: 'page loaded with the app', fix: 'lazy route', line: /^import (?!type)[^;]*from ['"][^'"]*\/pages\/(?!StatusPages)/, only: (f) => /(?:^|\/)(?:app\/router\/|App\.[jt]sx|main\.[jt]sx|routes?\.[jt]sx?|router\.[jt]sx?|[\w-]+[.-]routes?\.[jt]sx?)/.test(f) },
  { level: 'Medium', name: 'new context value on every render', fix: 'useMemo, or split the context', line: /<\w*Context(?:\.Provider)? value=\{\s*[{[]/ },
  { level: 'Medium', name: 'state set on every move or scroll', fix: 'ref, CSS, or IntersectionObserver', line: /\bon(?:Scroll|MouseMove|PointerMove|TouchMove|Wheel)=\{[^}&?]*\bset[A-Z]\w*\(/ },
  { level: 'Medium', name: 'whole form watched', fix: 'useWatch or useFormState in the small component that needs it', line: /\b(?:form|methods)\.watch\(|=\s*watch\(/ },
  { level: 'Medium', name: 'font from another server', fix: 'self-hosted @fontsource package', line: /fonts\.(?:googleapis|gstatic)\.com/, files: /\.(?:html|css|[jt]sx?)$/ },
  { level: 'Medium', name: 'blocking script', fix: 'defer, or whenIdle', line: /<script(?![^>]*\b(?:defer|async|type=["']module))[^>]*\bsrc=/, files: /\.html$/ },
  { level: 'Low', name: 'CSS @import of a URL', fix: 'import the file in main.tsx', line: /@import\s+(?:url\()?['"]?https?:/, files: /\.css$/ },
  { level: 'Low', name: 'heavy library, check that it loads on demand', fix: 'React.lazy or import() where it is used', line: { test: isHeavy, source: '' } },
  { level: 'Low', name: 'slow animation', fix: 'transition-colors, transform or opacity', line: /(?<![\w-])transition-(?:all|\[(?:width|height|top|left|margin)[^\]]*\])|transition:\s*(?:all|width|height|top|left|margin)\b/, files: /\.(?:css|[jt]sx?)$/ },
  { level: 'Low', name: 'slow copy', fix: 'structuredClone', line: /JSON\.parse\(JSON\.stringify\(/ },
  { level: 'Low', name: 'index as key', fix: 'stable id', line: /\bkey=\{(?:i|idx|index)\}/ },
  { level: 'Low', name: 'console output', fix: 'logger or remove', line: /\bconsole\.(?:log|debug|info)\(/, noComment: true },
  { level: 'Low', name: 'fixed path in link', fix: 'ROUTES constant', line: /(?:\bto=["']\/\w|navigate\(["']\/\w)/ },
  { level: 'Low', name: 'disabled lint rule without reason', fix: 'fix, or add "-- reason"', line: /eslint-disable(?!.*--)/ },
  { level: 'Low', name: 'unfinished note', fix: 'finish or file an issue', line: /\b(?:TODO|FIXME|HACK)\b/ },
];

function* walk(target) {
  if (statSync(target).isFile()) {
    if (/\.(tsx?|jsx?|css|html)$/.test(target)) yield target;
    return;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (/^(node_modules|dist|build|coverage|\..*)$/.test(entry.name)) continue;
    const full = path.join(target, entry.name);
    if (entry.isDirectory() || entry.isFile()) yield* walk(full);
  }
}

/** Opening JSX tags with their text; understands quotes and nested braces. */
function tags(text) {
  const found = [];
  for (const match of text.matchAll(/<([a-z][a-z0-9]*)(?=[\s/>])/g)) {
    let depth = 0;
    let quote = '';
    let end = match.index + match[0].length;
    for (; end < text.length && end - match.index < 4000; end++) {
      const c = text[end];
      if (quote) {
        if (c === quote && text[end - 1] !== '\\') quote = '';
      } else if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    found.push({ name: match[1], index: match.index, text: text.slice(match.index, end + 1) });
  }
  return found;
}

const src = path.join(project, 'src');
const html = path.join(project, 'index.html');
const targets = only.length ? only : existsSync(src) ? [src, ...(existsSync(html) ? [html] : [])] : [project];
const findings = [];
let count = 0;

for (const target of targets) {
  for (const file of walk(target)) {
    const name = path.relative(project, file).replaceAll('\\', '/');
    if (isTest(name)) continue;
    count++;
    const text = readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
    const lines = text.split('\n');
    const report = (rule, line) => {
      const accepted = [lines[line - 1], lines[line - 2]].some((l) => l?.includes('scan-ok:'));
      if (!accepted) findings.push({ ...rule, at: `${name}:${line}` });
    };
    const isComment = lines.map((l) => /^\s*(?:\/\/|\*|\/\*|\{\/\*)/.test(l));
    const jsx = /\.[jt]sx$/.test(file) ? tags(text) : [];
    for (const rule of rules) {
      if (rule.skip?.(name) || rule.only?.(name) === false) continue;
      if (!(rule.files ?? /\.[jt]sx?$/).test(name)) continue;
      if (rule.effect || rule.effectOnly) {
        for (const { index, body } of effectsIn(text)) {
          const hit = (rule.effect ?? rule.line).test(body);
          if (hit) report(rule, text.slice(0, index).split('\n').length);
        }
        continue;
      }
      if (rule.needs) {
        const at = lines.findIndex((l, i) => !isComment[i] && rule.needs.has.test(l));
        if (at >= 0 && !rule.needs.lacks.test(text)) report(rule, at + 1);
        continue;
      }
      if (rule.tag) {
        for (const tag of jsx) {
          if (!rule.tag.test(tag.name)) continue;
          if (rule.has && !rule.has.test(tag.text)) continue;
          if (rule.lacks?.test(tag.text)) continue;
          const line = text.slice(0, tag.index).split('\n').length;
          if (!isComment[line - 1]) report(rule, line);
        }
      } else {
        lines.forEach((l, i) => {
          if (isComment[i] && !rule.comments && !/ts-|eslint|TODO|FIXME|HACK/.test(rule.line.source)) return;
          if (rule.inClass && !/class(?:Name)?=|cn\(|['"`]/.test(l)) return;
          if (rule.line.test(l)) report(rule, i + 1);
        });
      }
    }
  }
}

// Packages that are used but not installed: often made up.
const manifest = path.join(project, 'package.json');
if (existsSync(manifest)) {
  const { builtinModules } = await import('node:module');
  const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = JSON.parse(readFileSync(manifest, 'utf8'));
  const installed = new Set([...Object.keys(dependencies), ...Object.keys(devDependencies), ...Object.keys(peerDependencies)]);
  for (const target of targets) {
    for (const file of walk(target)) {
      if (!/\.[jt]sx?$/.test(file)) continue;
      const name = path.relative(project, file).replaceAll('\\', '/');
      readFileSync(file, 'utf8').split('\n').forEach((l, i) => {
        const from = /^\s*(?:import|export)\b.*?from\s+['"]([^'"]+)['"]|^\s*\} from ['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]/.exec(l)?.slice(1).find(Boolean);
        if (!from || /^(?:[./~#]|@\/|node:|virtual:|https?:)/.test(from)) return;
        const pkg = from.split('/').slice(0, from.startsWith('@') ? 2 : 1).join('/');
        if (!installed.has(pkg) && !builtinModules.includes(pkg) && !l.includes('scan-ok:')) {
          findings.push({ level: 'High', name: 'package not in package.json', fix: 'check that it exists on npm, then install it, or use what is there', at: `${name}:${i + 1} ${pkg}` });
        }
      });
    }
  }
}

const order = ['High', 'Medium', 'Low'];
for (const level of order) {
  const groups = Map.groupBy
    ? Map.groupBy(findings.filter((f) => f.level === level), (f) => f.name)
    : findings.filter((f) => f.level === level).reduce((m, f) => m.set(f.name, [...(m.get(f.name) ?? []), f]), new Map());
  for (const [name, list] of groups) {
    console.log(`\n${level}: ${name} (${list.length}) -> ${list[0].fix}`);
    const shown = showAll ? list : list.slice(0, 6);
    for (const f of shown) console.log(`  ${f.at}`);
    if (list.length > shown.length) console.log(`  ... ${list.length - shown.length} more (--all)`);
  }
}
const total = (level) => findings.filter((f) => f.level === level).length;
console.log(`\n${count} files. High ${total('High')}, Medium ${total('Medium')}, Low ${total('Low')}.`);
process.exit(total('High') ? 1 : 0);
