# Instructions for AI assistants

A user gave you the link to this repository:
`https://github.com/Pandi2352/frontend-skills.git`

They want these frontend skills set up without doing the steps themselves. A link
alone means "install the skills". If they also asked for something, do that after
installing. Do not read the whole repository: it is large, and the steps below are
enough.

(If you are working on this repository itself, skip to "Maintaining".)

## 1. Check

- `git --version` and `node -v` (20.19 or newer). If one is missing or too old, tell
  the user and stop. Do not install or change Node.
- Read `install.mjs` before running it. It only copies the folders in `skills/`.
- If the target already has a `frontend-*` skill of the same name that did not come
  from here, ask before replacing it.

## 2. Install or update

First time:

```bash
git clone --depth 1 https://github.com/Pandi2352/frontend-skills.git "$HOME/frontend-skills"
node "$HOME/frontend-skills/install.mjs"
```

If `$HOME/frontend-skills` already exists and is a clone of this repository:

```bash
git -C "$HOME/frontend-skills" pull --ff-only
node "$HOME/frontend-skills/install.mjs"
```

If the user named one tool, add `--tool cursor` (claude, codex, cursor, opencode,
gemini, copilot, windsurf, cline, kilo, antigravity, roo).

If the pull fails because of local changes, tell the user; do not discard them. Never
clone into the user's project folder. The commands work in bash, zsh and PowerShell.
If you cannot run commands, give the user these two.

## 3. Continue in this session

New skills may appear only in a new session. Do not wait: read the one file you need
and follow it. Never read `assets/`.

| The user wants | Read in `$HOME/frontend-skills/skills/` |
| --- | --- |
| New project, page, form, component | `frontend-core/SKILL.md` |
| Charts, dashboard, kanban, calendar, import, auth pages, dark mode, languages | `frontend-blocks/SKILL.md` |
| API, login, permissions | `frontend-api/SKILL.md` |
| Speed, bundle size, long lists, leaks | `frontend-performance/SKILL.md` |
| Check code | `frontend-review/SKILL.md` |

If they only gave the link, say the skills are ready and ask one question: start a new
project, add to the current project, or review the current project? Do not create or
change a project before they answer.

Existing project: look at what it uses, then

```bash
node "$HOME/frontend-skills/skills/frontend-core/scripts/add-to-project.mjs" <project> --components
```

Leave out `--components` if it has its own components. Files are never overwritten.

New project: build it step by step as `frontend-core/SKILL.md` says. After each step tell
the developer what to check, ask, and stop.

## 4. Report

Short: what was installed, where, and what you did next. Mention anything that failed.

## Maintaining

- Skills are the folders in `skills/`. Edit them here, not the installed copies, then
  run `node install.mjs`.
- Keep `description` under 350 characters and `SKILL.md` under about 1,200 tokens.
  Details go to `references/`, work goes to `scripts/` with short output.
- Keep the README, the references and `.claude-plugin/marketplace.json` correct.
