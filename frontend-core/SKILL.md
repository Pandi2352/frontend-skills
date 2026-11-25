---
name: frontend-core
description: The user's standard React + TypeScript + Vite + Tailwind CSS v4 project setup, folder structure, reusable component rules, and ready-made code - form fields (phone, country, state, date, dropdown, upload), toaster, loaders, modal, confirm, data table, sidebar, navbar. Use whenever starting or scaffolding a new frontend project, React app, dashboard or admin panel, and whenever building or restyling any reusable UI in one - sidebar, navbar, layout, button, input, dropdown/select, date picker, form, modal, table - even if the user only says "new project", "setup", "create a form" or "add a page". Do not use for backend-only work or non-React projects.
---

# FrontendCore

Standards for every frontend project, for any AI coding tool. The user should
not have to repeat them. Nothing here depends on one vendor.

## Load only what the task needs

Do not read every reference. Read the one that matches:

| Task | Read |
| --- | --- |
| New project, where a file goes, naming, imports | `references/structure.md` |
| Colors, spacing, control heights, theme CSS | `references/design-tokens.md` |
| Any input, dropdown, date picker, upload, form, validation | `references/fields-and-forms.md` |
| Sidebar, navbar, page layout, routing shell | `references/app-shell.md` |
| What a project must include, planning setup | `references/must-have.md` |
| Button, modal, toaster, loaders, table, other UI | `references/components.md` |
| Any hook, util, helper, formatter, constant | `references/hooks-and-utils.md` |
| React/TS rules, API, auth, hooks, tests, done check | `references/engineering.md` |
| Before saying any React work is done | `references/ai-mistakes.md` |

In a project, read `docs/COMPONENTS.md` first: every component, hook and util with
its props in one file. Missing or old: `node <skill>/scripts/index-components.mjs
<project>`. Run it again after adding shared code.

Write new features, components and pages with the generator, then change what is
special. It gives types, service, queries, form, list, details, create, edit, routes
and tests that already follow the rules:

```
node <skill>/scripts/generate.mjs feature orders --project <project> --fields "customer:text!, total:currency!, status:select(open|paid), dueOn:date, note:textarea"
node <skill>/scripts/generate.mjs component shared/StatusDot --project <project>
```

Related skills: `frontend-api` (API, login, permissions), `frontend-blocks` (charts,
dashboard, kanban, calendar, import, auth and account pages, dark mode, languages,
notifications and more), `frontend-performance` (speed), `frontend-review` (check code
against these rules).

## Rules that always apply

1. **Reuse first.** Search `src/components`, `src/hooks`, `src/utils` and
   `src/lib` before writing anything. If something is needed twice, make it
   shared. Never copy markup or logic between pages. All form fields, toasts,
   loaders, dialogs, formatters and requests go through the shared version.
2. **Every field looks the same.** Input, dropdown, date picker, number, search,
   password and file trigger share one height, border, radius, padding, font
   size, focus ring, error and disabled style, all from one `field.styles.ts`.
3. **No native picker UI.** Never use `<select>`, `<datalist>`,
   `<input type="date|time|month|week|datetime-local|color">`, or
   `alert/confirm/prompt`. The browser draws these, so they cannot match the
   design system. Use our components. Elsewhere, prefer native semantic HTML
   (`button`, `a`, `nav`, `table`, `label`, `dialog`).
4. **Design tokens only.** No hex values, arbitrary colors, or raw palette
   classes such as `bg-white` or `text-gray-500` in components. Use
   `bg-surface`, `text-muted`, and so on.
5. **`rounded-md` everywhere, no shadows.** `rounded-full` only for avatar,
   radio, switch, spinner, dots. Overlays separate with a border and backdrop.
6. **Label every field.** Placeholder is never the label. Error goes directly
   below its field, never only in a toast. Never show status by color alone.
7. **Every async view** has loading, empty and error states with a retry.
8. **Accessible to WCAG 2.2 AA**: keyboard, visible focus, names, announcements.
9. **Mobile-first.** Must work at 360px without horizontal page scroll.
10. **Typed.** Strict TypeScript, no `any`. Pages do not call the API directly.
11. **Lucide icons only.** No new dependency without a stated reason.
12. **Config over hardcoding.** Routes, nav items, roles, query keys and
    option lists each live in one file.
13. **Fast by default.** Lazy pages, requests in parallel, state as low as
    possible, no effect for computed values, cleanup for everything started,
    reserved space for images. More: `frontend-performance`.

## Stack

React, TypeScript strict, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React
Router, React Hook Form, Lucide React, `clsx` + `tailwind-merge`,
`@floating-ui/react`, `libphonenumber-js` (phone, loaded on demand),
`country-region-data` (states, loaded on demand), `@tanstack/react-virtual`
(virtual table rows, loaded on demand), Vitest, React Testing Library, ESLint, Prettier.

Add only when needed: Zod (non-trivial validation), TanStack Query (server
data), TanStack Table (server-side or complex tables).

`@floating-ui/react` is included because dropdown, menu, popover, tooltip and
date picker all need positioning, dismissal and keyboard navigation. One small
headless library is safer than rewriting that five times.

## Package versions

Use the newest stable version of every package that works with the Node already
installed. Versions from memory are outdated, so always look them up online.

- Never install, upgrade, downgrade or switch Node, including through nvm, fnm
  or volta, unless the user asks. Packages adapt to Node.
- Run `scripts/resolve-versions.mjs` from this skill's folder (or the project's
  own copy). It reads the
  installed Node, checks the npm registry for `engines` and peer ranges, and
  prints exact install commands:
  - new stack: `node <skill>/scripts/resolve-versions.mjs`
  - extra packages: `... --project zod -D msw` (includes existing ones as context)
  - existing project check: `... --project`
- Run the printed commands as they are. A package not at latest must have a
  reason in the output; tell the user which ones and why.
- Also resolve `create-vite` this way and run that version, because the newest
  scaffolder may need a newer Node. Then replace the template's versions with
  the resolved ones.
- No `--force` or `--legacy-peer-deps`. Treat `EBADENGINE` as a failure: find
  the package that caused it and use its newest compatible version.
- Stable only, no alpha, beta, rc or deprecated versions.
- Check official current docs for setup steps when a major version is newer
  than you know. Do not use an old config style with a new major version.
- If the registry cannot be reached, say so and stop; do not guess versions.
- Commit the lockfile. Do not upgrade existing project packages unless asked.

## New project workflow

Create a project only when the user asks for one. Discussing or editing these
standards is not a request to scaffold, install or run anything.

1. Ask only what is missing, in one message: project name, primary color, light
   only or light and dark, sidebar or navbar-only layout, main modules. If the
   user says to just start: blue, light only, sidebar.
2. Check `node -v` and resolve versions (above). Scaffold with the Vite
   `react-ts` template, then install the resolved stack. Use official commands
   instead of writing config from memory.
3. Configure Tailwind, the `@/` alias (Vite and tsconfig), ESLint, Prettier,
   Vitest. Scripts: `dev build preview lint typecheck format test`.
4. Follow the tree in `structure.md`. Create a folder when its first real file
   exists, not as an empty placeholder.
5. Run `node <skill>/scripts/add-to-project.mjs <project> --components`. It
   copies finished, tested code: fields, forms, Button, Toaster, loaders, Modal,
   Drawer, Confirm, menus, Tabs, Cards, Stepper, CommandMenu, DataTable, Sidebar, Navbar, layouts, states, tokens and
   two playgrounds. Use it as it is; do not rewrite it. For a new project also take
   `assets/template/vite.config.ts` and `eslint.config.js` (alias, tests, ban on
   `<select>`), add `"paths": { "@/*": ["./src/*"] }` to the app tsconfig, import
   `styles/index.css` in `main.tsx`, set `config/app.config.ts`. Then fill in the
   blanks in `AGENTS.md`. It adds the rules and `docs/standards/`, so any AI tool
   follows them later, even without this skill installed.
6. Wrap the app in `AppProviders`, set up the router with `AppLayout`
   (`app-shell.md`), and fill `config/routes.ts` and `config/navigation.ts`. Build
   what is still open in `must-have.md` only when needed, then feature modules.
7. If the project has a backend, use the `frontend-api` skill for API and login.
   Use `frontend-performance` for size limits, preloading, images and fonts.
8. Run `index-components.mjs`, then `lint`, `typecheck`, `test`, `build`. Report real
   results.

Build one component at a time unless the user asks for a batch. Show each in
the `/playground` dev route with all its states.

## Save tokens

- Do not repeat these rules back or explain them unless asked.
- Read only the files being changed. Edit; do not reprint whole files.
- Finish with: files changed, check results, anything undecided.

If the project already exists and differs, follow its conventions and mention
the difference. Do not restructure it unless asked.
