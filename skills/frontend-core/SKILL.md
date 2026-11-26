---
name: frontend-core
description: Starts and builds React + TypeScript + Tailwind frontends from finished, tested code. Use for a new project, app, dashboard or admin panel, and for any page, form, field, dropdown, date picker, table, modal, toast, sidebar, navbar or component in one. Not for backend-only or non-React work.
---

# Frontend core

Scripts copy and generate finished code. You choose, connect and adapt. Never open
`assets/` and never retype what a script writes: that costs many tokens and is worse.
`<skill>` is the folder of this file.

## Build only what they ask

Build exactly what the developer asked for, one thing at a time. Nothing extra, also not
"while I am here". Then suggest, ask and **stop**. They check before the next thing.

New project: ask in one message only what is missing (folder, title, color). With the
layout, plan the menu from their project and check it against `references/layout-spec.md`. No backend given:
sample data for their project (`frontend-api/references/mock-data.md`).

```
node <skill>/scripts/create.mjs my-app --title "My app" --color "#2563eb" --ask sidebar,login,feature:orders
node <skill>/scripts/steps.mjs my-app                  # what was asked, what is done, ideas
node <skill>/scripts/steps.mjs my-app ok               # they checked the last one
node <skill>/scripts/steps.mjs my-app next             # the next thing they asked for
node <skill>/scripts/steps.mjs my-app build toast      # something new they asked for
node <skill>/scripts/steps.mjs my-app build feature:orders --fields "customer:text!, total:currency!"
node <skill>/scripts/steps.mjs my-app complete         # after writing code by hand
```

`--ask` holds only what they named; it is remembered. `create` builds just the setup, with
the sidebar or navbar when that comes first. Any order works: each thing brings only the code it imports and its packages.
`list` shows what can be built: steps, parts, single components, hooks and utils.

After each thing:

1. `node scripts/verify.mjs --fast` in the project; fix what fails. "to do" lines are yours.
2. Tell in a few lines what was built and what to check (the script prints it).
3. Give 2 to 4 of the printed ideas, the best first, in your own short words. Add one
   of your own only if their project clearly needs it.
4. Ask "OK? What next?" and stop. Never build an idea without a yes.

A change: do only that, verify, ask again. A new feature: plan it first and show the plan
(`references/feature-planning.md`); build after OK.
"Everything at once": `create.mjs … --ask … --all`. Special cases:
`references/new-project.md`.

## Working in a project

Features: `steps.mjs … build feature:…`, or `generate.mjs feature …` when the project has
no `docs/steps.json`. Field types: `text textarea email url phone number currency percent
date switch country select(a|b)`, `!` is required. In the project folder:

```
node scripts/generate.mjs component shared/StatusDot
node scripts/generate.mjs page reports/SalesReport
node scripts/index-components.mjs DataTable Dropdown    # props of these
node scripts/verify.mjs --fast                          # while working
node scripts/verify.mjs                                 # once, at the end
```

1. Look at the project first: `AGENTS.md`, `docs/PROGRESS.md` (what is built), then
   `docs/COMPONENTS.md` (a short list of what exists).
2. Generate, then change only what is special. Reuse; ask for props instead of
   opening component files or guessing.
3. Run `verify.mjs`. It prints little. Do not run the single checks as well.

Existing project without these scripts: `node <skill>/scripts/add-to-project.mjs
<project> [--components]`. Its own conventions win; do not restructure it.

## Rules

- All fields, dialogs, toasts, tables, requests: the shared one. Used twice: shared.
- No `<select>`, `<datalist>`, native date, time or color inputs, no `alert/confirm`.
- Labels on every field, error directly below it, same height (`h-control`).
- Tokens from `theme.css` only, no raw colors. `rounded-md`, no shadows, Lucide icons.
- Loading, empty and error with retry in every view. Keyboard, WCAG AA, 360 px.
- Strict types, no `any`. Pages → hooks → services → `api`. Lazy pages.
- Paths, menu and permissions in `src/config`. No effect for computed values.
- No invented packages, props or endpoints, no empty handlers. Sample data only in
  `src/mocks/`, as `mock-data.md` says.
- Packages: `scripts/resolve-versions.mjs --project <name>`. Never change Node.

## Read only when needed

| For | `references/` |
| --- | --- |
| special form or field behaviour, validation | `fields-and-forms.md` |
| table, modal, menu, tabs, states | `components.md` |
| layout: sidebar, navbar, page area, routes, error pages (full list) | `layout-spec.md` |
| sidebar, navbar, menu from the project, router (how to use) | `app-shell.md` |
| colors, sizes | `design-tokens.md` |
| where a file goes, naming | `structure.md` |
| which hook or util | `hooks-and-utils.md` |
| effects, async state, unusual code | `ai-mistakes.md` |
| types, tests, security | `engineering.md` |
| what a complete app needs | `must-have.md` |
| plan a feature: fields, pages, menu, permissions | `feature-planning.md` |

Other skills: `frontend-blocks` (charts, dashboard, kanban, calendar, import, auth,
dark mode, languages), `frontend-api`, `frontend-performance`, `frontend-review`,
`frontend-accessibility`, `frontend-security`, `frontend-design` (look and style).

Answer short: what changed, result of `verify`, open questions. Do not repeat rules
or print whole files.
