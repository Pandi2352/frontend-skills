---
name: frontend-review
description: Reviews React + TypeScript + Tailwind code and lists what to fix - native pickers, uneven fields, duplicates, raw colors, missing labels, errors and states, accessibility, types, API misuse, performance, security, AI mistakes such as invented packages or fake data. Use to check, audit or clean up code, a page or a project.
---

# Frontend review

Report first. Change code only when the user asks to fix.

## Steps

1. Scope: the files the user named, otherwise changed files (`git diff`),
   otherwise the project.
2. Scan. It finds the mechanical problems, so do not read files to look for them:

   ```
   node <skill>/scripts/scan.mjs <project> [file-or-folder ...]
   ```

   Each result is a lead, not a verdict. Open the line before reporting it.
3. Run `node scripts/verify.mjs` if the project has it, otherwise its own `lint`,
   `typecheck`, `test` and `build`. Report real results.
4. Read only the files in scope for what a scan cannot see (below).
5. Confirm each finding in the code. Drop what you cannot show.

Project decisions in `AGENTS.md` win over these standards. If
`docs/standards/` exists, use it when a rule is unclear.

## What a scan cannot see

**Reuse** - same markup or logic twice; a local version of a shared component,
hook, util, toast, loader or dialog; a shared component full of one-page props.

**Fields** - same height and look in one row; label always present; error
directly below; server errors reach their fields; first invalid field gets focus;
submit cannot run twice; values kept after failure; correct `autocomplete`.

**States** - loading, empty, no results, error with retry, disabled, read-only,
long text, many items, slow network, no permission.

**Accessibility** - keyboard path, visible focus, focus return after closing,
names on icon buttons, heading order, contrast, status not by color alone,
announcements, reduced motion, 200% zoom.

**Layout** - 360, 768 and 1280px; no sideways scroll; touch size; dark theme if
the project has one.

**Code** - effects that only derive state; server data copied into state; stale
requests; missing cleanup; unstable keys; unsafe casts; wrong import direction;
files in the wrong folder; nav items or paths outside `config`.

**Performance** - requests in a row that could run together; one request per row;
state too high, so typing redraws the page; row functions or columns created in
the component of a large table; long lists drawn completely; heavy parts not
loaded on demand; skeletons of another size. Fixing: `frontend-performance`.

**AI mistakes** - invented props, endpoints or packages; leftovers (fake data, empty
handlers, missing code); effects that only compute; races; old values in callbacks;
state changed in place; claims without a run. List: `ai-mistakes.md` of
`frontend-core`, or `docs/standards/` in a project.

**Security** - unsafe HTML or URLs; tokens in storage; secrets in `VITE_`;
redirects from user input; permission only hidden in the UI; personal data in
logs.

**Must-have** (whole project only) - toaster, loaders, error boundary, empty and
error states, 403/404, skip link, document titles, `.env.example`, tests.

## Report

Start with one line: number of findings by level and whether lint, types, tests
and build pass. Then a table, worst first:

| Level | Where | Problem | Fix |
| --- | --- | --- | --- |
| High | `UserForm.tsx:42` | native `<select>` | use `Dropdown` |

- **High**: broken behaviour, security, cannot be used with keyboard or screen
  reader, data loss.
- **Medium**: breaks a standard people can see, or duplicates shared code.
- **Low**: naming, structure, small cleanup.

Group repeats into one row with a count. Say what was not checked. No praise, no
list of things that are fine. End by offering to fix High and Medium.

When asked to fix: smallest change, reuse shared components, rerun the scan and
the checks, report what changed.
