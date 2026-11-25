# {{PROJECT_NAME}}

{{ONE_LINE_PURPOSE}}

React + TypeScript + Vite + Tailwind CSS v4. These rules apply to every AI tool
and developer.

## Commands

`npm run dev | build | lint | typecheck | test | format`

## Read only what the task needs

| Task | File in `docs/standards/` |
| --- | --- |
| Where files go, naming, imports | `structure.md` |
| Must-have items | `must-have.md` |
| Fields, dropdowns, forms, validation | `fields-and-forms.md` |
| Sidebar, navbar, pages, routing | `app-shell.md` |
| Buttons, modals, toaster, loaders, table | `components.md` |
| Hooks, utils, helpers, formatters | `hooks-and-utils.md` |
| Colors, sizes, theme | `design-tokens.md` |
| TypeScript, API, auth, tests, done check | `engineering.md` |

## Rules

- Search `src/components`, `hooks`, `utils` and `lib`; reuse before creating.
- All fields use `components/ui/fields`: same height (`h-control`), border,
  radius and states. Label above, error directly below.
- Never use `<select>`, `<datalist>`, native date/time/color inputs, or
  `alert/confirm/prompt`. Use `Dropdown`, `Combobox`, `DatePicker`, `useConfirm`.
- One Toaster, loader set, Modal, `useConfirm`, DataTable and AppLayout. Never
  build local versions. Examples: `src/app/pages/*Playground.tsx`.
- Tokens only (`src/styles/theme.css`). `rounded-md`, no shadows, Lucide icons.
- Nav items in `config/navigation.ts`, paths in `config/routes.ts`.
- Pages → hooks → services → `api-client`. No `any`.
- Loading, empty and error states for async views. WCAG 2.2 AA. Mobile-first.
- Fast by default: lazy pages, parallel requests, cleanup in every effect, table
  `columns` outside the component, `useWatch` instead of `watch`.
- No new dependency without a reason. For versions, run
  `node scripts/resolve-versions.mjs --project <package>`: newest stable that
  supports the installed Node. Never change the Node version.
- Never commit secrets or put them in `VITE_` variables.
- Keep replies short: files changed, check results, open questions.

## Project decisions

- Theme: {{LIGHT_OR_BOTH}}; layout: {{SIDEBAR_OR_NAVBAR}}
- Modules: {{MODULES}}
