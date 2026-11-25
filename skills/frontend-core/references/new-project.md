# New project, special cases

`create.mjs` and `steps.mjs` do all of this. Read on only when they cannot be used.

## Steps

State: `docs/steps.json` (for the scripts) and `docs/PROGRESS.md` (for people). A step is
to do, built, checked or skipped. `next` refuses while one waits for its check. Every step
copies its part with everything it imports, adds the tests that can run, installs only
the packages it needs, and connects it in router, App, main, menu and shell. Files changed
by hand are not overwritten: the new version is in `docs/proposed/`; merge it, then delete
it. Generated features are always kept.

## Options

| Option | Meaning |
| --- | --- |
| `--title`, `--color "#rrggbb"` | name; main color, darkened if text would be unreadable |
| `--dark` | light and dark |
| `--layout navbar` | without sidebar |
| `--blocks a,b` | from `frontend-blocks`; `auth-pages` also adds guarded routes |
| `--locale en-IN --currency INR --country IN` | formats and defaults |
| `--no-api` | no server: no API client, login state or TanStack Query |
| `--features a,b` | features to plan as steps |
| `--all` | every step at once, without stopping |
| `--no-install` | files only |

The folder must be empty. Afterwards: `.env`, the real endpoints in `*.service.ts`,
`config/permissions.ts`, logo, modules in `AGENTS.md`.

## Other frameworks

Next.js, Remix, TanStack Start: create them with their official command. Then
`add-to-project.mjs <project> --components`. Replace `react-router` in `components/layout`,
`useTableState`, `useUrlState`. Mark interactive files with `'use client'`.

## By hand

1. `node -v`; versions from `resolve-versions.mjs` (also `create-vite`). Run the printed
   commands unchanged.
2. Vite `react-ts`, then `add-to-project.mjs <project> --components`.
3. From `assets/template`: `vite.config.ts`, `eslint.config.js`. Alias
   `"paths": { "@/*": ["./src/*"] }`. Import `styles/index.css` in `main.tsx`.
4. `AppProviders`, router with `AppLayout` (`app-shell.md`), `config/routes.ts`,
   `config/navigation.ts`, `config/app.config.ts`, blanks in `AGENTS.md`.
5. `index-components.mjs`, `verify.mjs`.

## Package versions

Newest stable that works with the installed Node, always looked up, never from memory.

- Never install, upgrade or switch Node. Packages adapt to it.
- New packages: `resolve-versions.mjs --project zod -D msw`. Existing ones: `--project`.
- A package that is not the latest has a reason in the output; tell the user.
- No `--force`, no `--legacy-peer-deps`. `EBADENGINE` is a failure: find the package.
- Newer major than you know: read its current docs. Registry not reachable: stop.
- Commit the lockfile. Do not upgrade existing packages unless asked.
- Only with a reason: Zod, TanStack Table, others.
