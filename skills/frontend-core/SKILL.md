---
name: frontend-core
description: Starts and builds React + TypeScript + Tailwind frontends from finished, tested code. Use for a new project, app, dashboard or admin panel, and for any page, form, field, dropdown, date picker, table, modal, toast, sidebar, navbar or component in one. Not for backend-only or non-React work.
---

# Frontend core

Scripts copy and generate finished code. You choose, connect and adapt. Never open
`assets/` and never retype what a script writes: that costs many tokens and is worse.
`<skill>` is the folder of this file.

## New project: one step, then stop

Developers check each step. Never build the next one without their OK, and never use
`--all` unless they ask for everything at once.

Ask in one message only what is missing: folder, title, color, dark theme, sidebar or
navbar, parts, features. "Just start" means blue, light, sidebar. Then:

```
node <skill>/scripts/create.mjs my-app --title "My app" --color "#2563eb" --dark --blocks dashboard,auth-pages --features orders,customers
node <skill>/scripts/steps.mjs my-app            # plan and state, also in a later chat
node <skill>/scripts/steps.mjs my-app ok next    # after their OK: builds one step
```

Order: setup, layout, common components, forms, hooks, table, API, speed, parts,
features. The script does the work and prints what to check. Each time:

1. `node scripts/verify.mjs --fast` in the project; fix what fails.
2. Show the printed check list in a few lines.
3. Ask: "OK, change something, or skip the next?" **Then stop and wait.**

They want a change: do only that, verify, ask again. Also: `skip`, `add charts`,
`add feature:products`. A feature step: ask for its fields and rules, generate, adapt,
then `steps.mjs my-app built feature:orders`. "to do" lines are for you.

Parts: `node <skill>/../frontend-blocks/scripts/add.mjs --list`. Only if something
special is needed: `references/new-project.md`.

## Every feature

In the project folder:

```
node scripts/generate.mjs feature orders --fields "customer:text!, total:currency!, status:select(open|paid), dueOn:date, note:textarea"
node scripts/generate.mjs component shared/StatusDot
node scripts/index-components.mjs DataTable Dropdown    # props of these
node scripts/verify.mjs --fast                          # while working
node scripts/verify.mjs                                 # once, at the end
```

1. Look at the project first: `AGENTS.md`, `docs/PROGRESS.md` (steps), then
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
- No invented packages, props or endpoints; no fake data or empty handlers.
- Packages: `scripts/resolve-versions.mjs --project <name>`. Never change Node.

## Read only when needed

| For | `references/` |
| --- | --- |
| special form or field behaviour, validation | `fields-and-forms.md` |
| table, modal, menu, tabs, states | `components.md` |
| sidebar, navbar, router | `app-shell.md` |
| colors, sizes | `design-tokens.md` |
| where a file goes, naming | `structure.md` |
| which hook or util | `hooks-and-utils.md` |
| effects, async state, unusual code | `ai-mistakes.md` |
| types, tests, security | `engineering.md` |
| what a complete app needs | `must-have.md` |

Other skills: `frontend-blocks` (charts, dashboard, kanban, calendar, import, auth,
dark mode, languages), `frontend-api`, `frontend-performance`, `frontend-review`.

Answer short: what changed, result of `verify`, open questions. Do not repeat rules
or print whole files.
