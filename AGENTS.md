# Instructions for AI assistants

A user gave you the link to this repository:
`https://github.com/Pandi2352/frontend-skills.git`

They want these frontend skills set up without doing the steps themselves. A link
alone means "install the skills". If they also asked for something, do that after
installing.

(If you are working on this repository itself, skip to "Maintaining".)

## 1. Check

- `git --version` and `node -v` (20.11 or newer). If one is missing or too old,
  tell the user and stop. Do not install or change Node.
- Read `install.mjs` before running it. It only copies the skill folders to
  `~/.agents/skills` and `~/.claude/skills`.
- If one of those already has `frontend-core`, `frontend-blocks`,
  `frontend-api`, `frontend-performance` or `frontend-review` that did not come from
  here, ask before replacing it.

## 2. Install or update

First time:

```bash
git clone https://github.com/Pandi2352/frontend-skills.git "$HOME/frontend-skills"
node "$HOME/frontend-skills/install.mjs"
```

If `$HOME/frontend-skills` already exists and is a clone of this repository:

```bash
git -C "$HOME/frontend-skills" pull --ff-only
node "$HOME/frontend-skills/install.mjs"
```

If the pull fails because of local changes, tell the user. Do not discard them.
Never clone into the user's project folder.

Both commands work in bash, zsh and PowerShell. If you cannot run commands, give
the user these two commands instead.

## 3. Continue in this session

New skills may appear only in a new session. Do not wait: read the skill file and
follow it now.

| The user wants | Read |
| --- | --- |
| New project, page, form, component | `$HOME/frontend-skills/frontend-core/SKILL.md` |
| Charts, dashboard, kanban, calendar, import, auth pages, dark mode, languages, notifications | `$HOME/frontend-skills/frontend-blocks/SKILL.md` |
| API, login, permissions | `$HOME/frontend-skills/frontend-api/SKILL.md` |
| Speed, bundle size, long lists, leaks | `$HOME/frontend-skills/frontend-performance/SKILL.md` |
| Check code | `$HOME/frontend-skills/frontend-review/SKILL.md` |

If they only gave the link, say the skills are ready and ask one question: start a
new project, add to the current project, or review the current project? Do not
create or change a project before they answer.

For an existing project, first look at what it uses. Then:

```bash
node "$HOME/frontend-skills/frontend-core/scripts/add-to-project.mjs" <project> --components
```

Leave out `--components` if it has its own components. Files are never
overwritten. The skill says which packages and settings follow.

## 4. Report

Short: what was installed, where, and what you did next. Mention anything that
failed.

## Maintaining

Skills are the folders with a `SKILL.md`. Edit them here, not the installed
copies. Keep the README and the references correct, then run `node install.mjs`.
