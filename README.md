# Frontend skills

Ready-made skills that teach AI coding tools to build React frontends the same
way every time. The AI copies finished, tested code instead of writing it again,
so you explain less, use fewer tokens, and every project looks and works alike.

Stack: React, TypeScript, Vite, Tailwind CSS v4, React Router, React Hook Form.

| Skill | What it does |
| --- | --- |
| [`frontend-core`](frontend-core/SKILL.md) | Project setup, folder structure, design rules, 45+ form fields, toaster, loaders, modal, confirm, data table, sidebar, navbar |
| [`frontend-api`](frontend-api/SKILL.md) | API client, errors, login, token refresh, protected routes, permissions, upload |
| [`frontend-review`](frontend-review/SKILL.md) | Checks a project against these rules and lists what to fix |

## Quick start: paste this into your AI

Works with AI tools that can run commands, such as Claude Code, Cursor, Codex,
Copilot agent or Gemini CLI. Copy one line:

**Only install**

```text
Set up https://github.com/Pandi2352/frontend-skills.git - read AGENTS.md there and follow it.
```

**Start a new project**

```text
Set up https://github.com/Pandi2352/frontend-skills.git - read AGENTS.md there and follow it. Then start a new React project.
```

**Add to the project I have open**

```text
Set up https://github.com/Pandi2352/frontend-skills.git - read AGENTS.md there and follow it. Then add it to this project.
```

**Review the project I have open**

```text
Set up https://github.com/Pandi2352/frontend-skills.git - read AGENTS.md there and follow it. Then review this project.
```

The AI installs or updates the skills and continues with your request. You need
[Git](https://git-scm.com) and Node.js 20.11 or newer. Paste the same line again
later to update.

> **AI assistants:** if a user gave you this link, read
> [AGENTS.md](https://raw.githubusercontent.com/Pandi2352/frontend-skills/main/AGENTS.md)
> and follow it.

## Install by hand

```bash
git clone https://github.com/Pandi2352/frontend-skills.git
cd frontend-skills
node install.mjs
```

This copies the skills to `~/.agents/skills` and `~/.claude/skills`. Start a new
session in your AI tool afterwards.

One skill only: `node install.mjs frontend-core`

> If you already have a skill with the same name, its files are replaced.

## Use

Say what you want in normal words:

| You want | Say |
| --- | --- |
| New project | "start a new React project" |
| Page or form | "create a users page with a form" |
| Backend | "connect the API and add login" |
| Check code | "review this project" |

In Claude Code you can also type `/frontend-core`, `/frontend-api` or
`/frontend-review`.

If your tool does not support skills, tell it: "Read
`<path>/frontend-skills/frontend-core/SKILL.md` and follow it."

## Add to an existing project

```bash
# Rules and standards only
node frontend-core/scripts/add-to-project.mjs <your-project>

# Rules and all components
node frontend-core/scripts/add-to-project.mjs <your-project> --components

# API and login code (add frontend-core with --components first)
node frontend-api/scripts/add-to-project.mjs <your-project>
```

Existing files are never overwritten. The rules are added as `AGENTS.md`,
`CLAUDE.md`, `GEMINI.md` and `docs/standards/`, so other AI tools and teammates
follow them even without installing the skills.

Afterwards:

1. Fill in the `{{...}}` blanks in `AGENTS.md`.
2. Install the packages: `node scripts/resolve-versions.mjs` prints the install
   commands. It picks the newest versions that work with your Node.
   `frontend-api` also needs `@tanstack/react-query`.
3. Use `frontend-core/assets/template/vite.config.ts` and `eslint.config.js`, or
   copy what you need from them.
4. Add `"paths": { "@/*": ["./src/*"] }` to your app's tsconfig.
5. Import `@/styles/index.css` in `main.tsx`.

Or let the AI do it: "use frontend-core in this project".

## Examples

Every field takes the same props. Only `label` is required:

```tsx
<Input label="Email" type="email" required helperText="Work email" error={message} />
<PhoneInput label="Phone" value={phone} onChange={setPhone} />
<Dropdown label="Role" options={roles} clearable searchable />
```

In a form, `{...field}` connects the value, error and focus:

```tsx
<Form form={form} onSubmit={save}>
  <FormField control={form.control} name="email" rules={{ required: 'Enter your email' }}
    render={(field) => <Input {...field} label="Email" required />} />
  <FormActions submitLabel="Save" />
</Form>
```

Toast and confirm:

```tsx
toast.success('User saved');

if (await confirm({ title: 'Delete user?', variant: 'danger' })) remove();
```

See all of them working in
[`FieldsPlayground.tsx`](frontend-core/assets/template/src/app/pages/FieldsPlayground.tsx) and
[`ComponentsPlayground.tsx`](frontend-core/assets/template/src/app/pages/ComponentsPlayground.tsx).

Guides:
[fields and forms](frontend-core/references/fields-and-forms.md) ·
[components](frontend-core/references/components.md) ·
[sidebar and navbar](frontend-core/references/app-shell.md) ·
[folder structure](frontend-core/references/structure.md) ·
[what a project must have](frontend-core/references/must-have.md) ·
[auth](frontend-api/references/auth.md)

## Make it yours

Change these files in your project:

| Change | File |
| --- | --- |
| Colors, sizes, spacing | `src/styles/theme.css` |
| App name, language format, currency, country | `src/config/app.config.ts` |
| Words shown by components | `src/constants/ui-text.ts`, `field-text.ts` |
| Menu and paths | `src/config/navigation.ts`, `routes.ts` |
| Roles and permissions | `src/config/permissions.ts` |
| Login addresses | `src/features/auth/services/auth.service.ts` |

## Main rules

- Reuse before writing. One version of every component.
- All fields have the same height and look. Error directly below the field.
- No native `<select>`, date, time or color inputs, and no browser dialogs.
- Design tokens only, `rounded-md`, no shadows, Lucide icons.
- Loading, empty and error state for every view. Keyboard and mobile friendly.
- Newest packages that work with your Node. Your Node version is never changed.

## Check a project

```bash
node frontend-review/scripts/scan.mjs <your-project>
```

## Update

```bash
git pull
node install.mjs
```

Projects you already created keep their own copy of the code.

## Change a skill

Edit the files in this repository, not the installed copies. Then run
`node install.mjs`, commit and push.

## Uninstall

Delete the `frontend-core`, `frontend-api` and `frontend-review` folders in
`~/.agents/skills` and `~/.claude/skills`.

## Not included

- Tabs, accordion, stepper, command menu and charts have rules, but no code yet.
- Rich text, code editor, captcha, maps and image crop need a library you choose.
- Cities have no built-in list. Connect your own API with `loadCities`.
