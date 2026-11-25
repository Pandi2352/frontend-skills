---
name: frontend-blocks
description: Finished, tested React + TypeScript + Tailwind blocks to copy into a project on request - charts, dashboard page, kanban board, drag-and-drop sortable list, event calendar, CSV import wizard, infinite list, login, register, OTP, forgot and reset password pages, profile and settings pages, dark mode, multiple languages with right-to-left, unsaved-changes warning, autosave, notifications, realtime WebSocket, idle logout. Use whenever the user asks for any of these, even in other words such as "graph", "analytics page", "board", "reorder", "schedule", "import from Excel or CSV", "sign up page", "theme switch", "translate the app", "Arabic", "live updates" or "session timeout", before writing it yourself.
---

# Frontend blocks

Copy, do not rewrite. Each block is built from the shared components of
`frontend-core`, tested, works with keyboard and at 360 px. Add a block only when
the project needs it.

```
node <skill>/scripts/add.mjs --list
node <skill>/scripts/add.mjs <project> charts kanban
```

It also copies the blocks these need, adds paths to `config/routes.ts`, and prints
the packages and the next steps. It never overwrites a file and stops when
`frontend-core`, `frontend-api` or `frontend-performance` code is missing; add that
first, or ask if the project has its own components.

| Block | For |
| --- | --- |
| `charts` | change over time, comparison, shares, ranking |
| `dashboard` | numbers, charts and recent rows with one period filter |
| `drag-sort`, `kanban` | order by hand; cards in columns |
| `calendar` | events by day |
| `csv-import` | many records from a file |
| `infinite-list` | endless feed or log |
| `auth-pages` | login, register, code, forgot, reset, change password |
| `account-pages` | profile, settings |
| `dark-mode`, `i18n` | themes, languages and direction |
| `unsaved-changes`, `autosave` | forms that must not lose work |
| `notifications`, `realtime` | bell and page; live updates |
| `idle-logout` | sign out after inactivity |

List, details, create and edit pages of your own data are written by the generator
of `frontend-core`: `scripts/generate.mjs feature orders --fields "…"`.

## Steps

1. Pick the block. If two fit, ask.
2. Add it, install the printed packages with `resolve-versions.mjs`, follow the
   printed next steps.
3. Adapt only services (`*.service.ts`), texts (`…Text` objects) and config. If the
   real API differs, translate in the service, not in the pages.
4. Read the part you need: `references/data.md` (charts, kanban, calendar, import,
   lists) or `references/features.md` (everything else).
5. `typecheck`, `lint`, `test`, `build`. Say which endpoints are assumed.

## Rules

- Never leave sample numbers in a page. No data yet: the empty state.
- Charts follow the rules in `data.md`; never two y-axes.
- Optimistic moves and switches must undo when saving fails.
- Hiding a page is not security. The server checks every request.
- Password, code and session rules belong to the server; the pages only help.
