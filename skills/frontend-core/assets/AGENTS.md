# {{PROJECT_NAME}}

{{ONE_LINE_PURPOSE}}

React, TypeScript, Vite, Tailwind CSS v4.

## Work like this

0. Build only what the developer asks, one thing at a time. Then verify, say what to
   check, suggest 2 to 4 next steps, ask, and stop. `docs/PROGRESS.md` shows the state;
   `steps.mjs` of the `frontend-core` skill builds and suggests.
1. Read `docs/COMPONENTS.md`: the short list of what exists. Reuse it.
2. Props: `node scripts/index-components.mjs DataTable Dropdown`. Do not open component
   files or guess.
3. New feature, part or component: `steps.mjs <project> build …` of the skill; it brings
   what is missing. Without the skill: `node scripts/generate.mjs feature orders --fields
   "customer:text!, status:select(open|paid)"` or `component shared/Name`. Then adapt.
4. `node scripts/verify.mjs --fast` while working, `node scripts/verify.mjs` at the end.
   Do not run the single checks as well.
5. After adding shared code: `node scripts/index-components.mjs`.

Charts, dashboard, kanban, calendar, import, auth pages, dark mode, languages: use the
`frontend-blocks` skill if it is installed, before writing them.

## Rules

- Use the shared fields, dialogs, toasts, tables and API client. No second version.
- No `<select>`, `<datalist>`, native date, time or color inputs, no `alert/confirm`.
- Label on every field, error directly below, same height.
- Tokens from `src/styles/theme.css`, `rounded-md`, no shadows, Lucide icons.
- Loading, empty and error with retry. Keyboard, WCAG AA, 360 px.
- Pages → hooks → services → `api`. No `any`. Paths and menu in `src/config`.
- No invented packages, props or endpoints; no fake data, empty handlers or
  `// ... rest of the code`.
- New package: a reason, and `node scripts/resolve-versions.mjs --project <name>`. Never
  change Node. No secrets in `VITE_` variables.

Details only when needed: `docs/standards/` (fields, components, app shell, tokens,
structure, hooks, `ai-mistakes.md` for effects and async code).

## Decisions

- Theme: {{LIGHT_OR_BOTH}}; layout: {{SIDEBAR_OR_NAVBAR}}
- Modules: {{MODULES}}
