// What could come next, based on what the project has now. Only ideas: nothing is
// built until the developer asks for it.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');

/** Own features (not login and other ready parts), with their fields. */
export function readFeatures(project) {
  const root = path.join(project, 'src/features');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(root, e.name, `${e.name}.routes.ts`)))
    .map(({ name }) => {
      const types = path.join(root, name, 'types');
      const text = existsSync(types) ? readdirSync(types).map((f) => read(path.join(types, f))).join('\n') : '';
      const body = /interface \w+Input \{([\s\S]*?)\n\}/.exec(text)?.[1] ?? '';
      const fields = [...body.matchAll(/^ {2}(\w+): (.*);$/gm)].map(([, key, type]) => ({ key, type }));
      const choices = [...text.matchAll(/export const (\w+)Values = /g)].map((m) => m[1]);
      return { name, fields, choices };
    });
}

/** Up to `max` ideas: what to say, and why. The most useful first. */
export function suggest(project, { planned = [], max = 4 } = {}) {
  const has = (file) => existsSync(path.join(project, 'src', file));
  const ideas = [];
  const add = (id, say, why) => {
    if (!planned.includes(id) && !ideas.some((i) => i.id === id)) ideas.push({ id, say, why });
  };
  const layout = has('app/layouts/AppLayout.tsx');
  const login = has('features/auth/pages/LoginPage.tsx');
  const features = readFeatures(project);
  const one = (name) => name.replace(/ies$/, 'y').replace(/s$/, '');

  if (!layout) add('layout', 'Add the sidebar and navbar', 'every page needs a frame');
  if (layout && !features.length && !has('app/pages/BasicsPlayground.tsx')) add('basics', 'Show the common components', 'check buttons, cards, dialogs and toasts on one page');
  if (!features.length) add('feature:…', 'Add a feature, for example orders with customer, total and status', 'list, details, form and tests in one step');

  // Ideas from the data that is already there.
  for (const f of features) {
    const status = f.choices.find((c) => /status|stage|state/i.test(c)) ?? null;
    if (status && !has('components/shared/kanban')) add('block:kanban', `Show the ${f.name} as a board by ${status}`, `${f.name} have a ${status}`);
    const date = f.fields.find((x) => /(^date|date$|On$|At$|due|start)/i.test(x.key) && /string/.test(x.type));
    if (date && !has('components/shared/event-calendar')) add('block:calendar', `Show the ${f.name} in a calendar by ${date.key}`, `${f.name} have a date`);
    for (const other of features) {
      const link = f.fields.find((x) => x.key.toLowerCase() === one(other.name).replace(/-/g, '') && x.type === 'string');
      if (other !== f && link) add(`link:${f.name}`, `In the ${one(f.name)} form, choose the ${link.key} from the ${other.name} list`, 'it is a plain text field now');
    }
  }
  if (features.length && !has('features/dashboard')) add('block:dashboard', `Add a dashboard with numbers and a chart of the ${features[0].name}`, 'the start page is still empty');
  if (features.length && !login) add('block:auth-pages', 'Add login pages', 'everybody can open the pages now');
  if (login && !has('features/account/pages/ProfilePage.tsx')) add('block:account-pages', 'Add profile and settings', 'people cannot change their name or password');
  const uses = (pattern) => features.some((f) => pattern.test(read(path.join(project, `src/features/${f.name}/components`, readdirSync(path.join(project, `src/features/${f.name}/components`)).find((n) => n.endsWith('Form.tsx')) ?? ''))));
  if (features.length && !has('components/shared/unsaved-changes')) add('block:unsaved-changes', 'Warn before leaving a changed form', 'changes can get lost');
  else if (features.length && !uses(/UnsavedChangesGuard/)) add('use:unsaved-changes', 'Use the unsaved-changes warning in the forms', 'it is there but not used');
  if (features.length && !has('components/shared/csv-import')) add('block:csv-import', `Import ${features[0].name} from a CSV file`, 'many records at once');
  if (features.length && layout) add('connect', 'Connect the API (give the OpenAPI file or the endpoints)', 'the server addresses are assumptions');
  if (layout && !has('hooks/useTheme.ts')) add('block:dark-mode', 'Add dark mode', 'light only now');
  if (login && !has('features/notifications')) add('block:notifications', 'Add notifications with a bell', 'nothing tells people about changes');
  if (login && !has('components/shared/idle-logout')) add('block:idle-logout', 'Sign out after 15 minutes without activity', 'safer on shared computers');
  if (features.length > 1 && !has('lib/preload-routes.ts')) add('speed', 'Add speed limits and page preloading', 'keeps the app small and fast');
  if (features.length && !has('lib/i18n.ts')) add('block:i18n', 'Add another language', 'English only now');
  return ideas.slice(0, max);
}
