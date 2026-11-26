# Scan findings: what they mean and how to fix them

One entry for every name `scan.mjs` prints, grouped like its output. Each says
why it matters and the usual fix. Before you fix anything, open the line and
confirm the finding. A finding is a lead, not a verdict.

When a fix needs a shared component, check its props first:
`node scripts/index-components.mjs <Name>` inside the project. Do not open the
component file or guess.

## Fields and controls

**native picker element** (High): `<select>` or `<datalist>`.
They look different in every browser, cannot be searched or styled, and break
the even field heights.
Fix: `Dropdown` (a few options), `Combobox` (many, searchable),
`MultiDropdown` (several). Keep `label`, `value`, `onChange`, `error`, and give
`options` as `{ value, label }`.

**native date/time/color input** (High): `type="date"` and similar.
Each browser shows a different picker and format, and the value format differs.
Fix: `DatePicker`, `DateRangePicker`, `TimePicker`, `MonthPicker`, `ColorPicker`.
Store ISO strings, and format for display with `utils/date`.

**raw form control** (Medium): `<input>` or `<textarea>` outside
`components/ui`.
It has no label, error or height of the shared fields, so the form looks uneven
and screen readers miss the label.
Fix: the matching field (`Input`, `Textarea`, `NumberInput`, `CurrencyInput`,
`SearchInput`…). In a form, wrap it in `FormField`.

**raw button** (Medium): `<button>` outside `components/ui`, `layout`, `shared`.
Fix: `Button` with `variant` and `size`. For an icon-only button use `IconButton`
with `label`. Keep `type="submit"` where it submits.

**browser dialog** (High): `alert`, `confirm`, `prompt`.
They block the page, cannot be styled, and are skipped in some browsers.
Fix: `await confirm({ title, message, confirmLabel, variant: 'danger' })` from
`useConfirm` for questions, `toast` for messages, `Modal` for input.

## Look

**hardcoded color class** (Medium): `bg-blue-600`, `text-gray-500`…
**arbitrary color** (Medium): `bg-[#123456]`.
**inline color** (Medium): `style={{ color: '#…' }}`.
They ignore the theme and dark mode, and drift from the brand.
Fix: the token class with the same role: `bg-surface`, `bg-subtle`,
`text-muted`, `text-foreground`, `border-line`, `bg-primary`, `text-danger`. If
no token fits, the design needs one: add it in `theme.css` (and `dark.css`).

**shadow** (Medium) and **other border radius** (Medium).
The template is flat with one radius, and a different value looks pasted in.
Fix: `border border-line` instead of a shadow, `rounded-md` instead of another
radius. Floating layers already have their look. A project that changed its
look on purpose (see its `docs/DESIGN.md` or `AGENTS.md`) wins.

**dark: class** (Medium).
Dark mode works by swapping tokens, so `dark:` classes fight it.
Fix: remove the `dark:` class and use a token that has a dark value.

**slow animation** (Low): `transition-all`, or width, height, top, left,
margin.
Fix: `transition-colors`, or animate `transform` and `opacity`.

## Accessibility

**image without alt** (High).
Fix: `alt` that says what matters. Use `alt=""` when the image is decorative,
for example an avatar next to the name.

**click on a non-interactive element** (High): `onClick` on a `div`, `span`,
`li`, `td`, `tr`.
Keyboard and screen reader users cannot reach it.
Fix: put a `Button` or a `Link` inside, and make the visible label the name. For
clickable table rows, link the first cell and keep the row click as an extra.

**visible focus removed** (High): `outline-none` without a `focus-visible`
style.
Fix: remove it, or add `focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-focus`.

**new tab without rel** (High).
Fix: `rel="noopener noreferrer"`.

## Security

**unsafe HTML** (High): `dangerouslySetInnerHTML`, `.innerHTML =`.
Outside text can run as code.
Fix: render as text. If HTML is really needed, sanitize it with DOMPurify in one
shared component. Details: `frontend-security`.

**token in browser storage** (High).
Any script on the page can read storage.
Fix: the `frontend-api` session (memory plus an httpOnly cookie). If the backend
cannot do that, report it and ask.

**eval** (High): `eval`, `new Function`.
Fix: remove it. Use a lookup object or a real function.

**secret in public variable** (High): `VITE_…SECRET`.
Every `VITE_` value is in the bundle.
Fix: move the call to the server, delete the variable, and tell the user to
rotate the key, because it has been public.

## API and data

**request outside the API client** (Medium): `fetch`, `axios`,
`XMLHttpRequest` outside services.
It skips auth headers, refresh, error mapping and cancelling.
Fix: a function in `features/<x>/services/<x>.service.ts` that uses `api`, and a
query or mutation hook around it.

**request in an effect** (High).
It brings races, double requests in Strict Mode, no cache and no retry.
Fix: `useQuery` with the feature's keys (`orderKeys`) and `signal`. For actions, use
`useMutation` and invalidate after.

**query data copied into state** (Medium).
Two copies get out of sync.
Fix: use `query.data` directly. For an editable copy, a form with
`defaultValues`, reset when the data changes (`values` option).

**fake data** (Medium): lorem, "John Doe", placeholder APIs, `mockUsers`.
Fix: the real service, or the empty state. If no backend exists yet, move the
data to `src/mocks/` as `frontend-api/references/mock-data.md` says.

**fake waiting** (Medium): `new Promise((r) => setTimeout(r, …))`.
Fix: the real request. Only `src/mocks/` may wait on purpose.

**failure hidden** (High): an empty `catch`.
The user sees nothing and the data may be lost.
Fix: show the error (`toast.error(getErrorMessage(error))`, or the field
errors), or write in a comment why it is safe to ignore.

## React

**effect that only computes** (Medium): an effect that only calls a setter.
It adds an extra render and shows a stale value for one frame.
Fix: compute while rendering (`const total = items.reduce(…)`), with `useMemo`
only if measured slow.

**async effect** (Medium): `useEffect(async () => …)`.
It returns a promise instead of a cleanup.
Fix: usually `useQuery`. Otherwise, write an async function inside the effect,
call it, and cancel in the cleanup.

**prop copied into state** (Medium).
Fix: use the prop. To reset on a new item, give the component `key={id}`.

**random or time value while rendering** (Medium): `key={Math.random()}`.
It remounts on every render, and loses focus and state.
Fix: a stable id from the data, or `useId` for element ids.

**new context value on every render** (Medium).
Fix: `useMemo` on the value, or a constant outside the component.

**index as key** (Low).
Fix: the item id. Index keys are fine only for static lists that never change
order.

**button that does nothing** (Medium): an empty handler, `console.log`, or
`href="#"`.
Fix: the real action. If it is not built yet, remove the button and tell the
user.

**code left out** (High): `// ...rest of the code`, "implementation here".
Fix: write the missing code, or report that the file is incomplete.

## Cleanup and leaks

**listener**, **interval**, **observer**, **connection or worker without
cleanup**, **file URL never released** (Medium).
They keep running after the page is closed, so memory grows and handlers fire
twice.
Fix: return a cleanup from the effect: `removeEventListener` or an
`AbortController` signal, `clearInterval`, `disconnect`, `close` or
`terminate`, `URL.revokeObjectURL`.

## Performance

**page loaded with the app** (Medium): a page imported directly in the router.
Fix: `lazy: async () => ({ Component: (await import('…/OrdersPage')).OrdersPage })`.

**whole library imported** (Medium): lodash, moment, `import * as` icons.
Fix: single imports, `Intl` and `utils`, single icon imports.

**heavy library** (Low): charts, editors, maps, PDF and similar.
Fix: confirm it loads only where used (`lazy`, `LazySection`, `import()` in the
handler).

**image without size** (Medium).
It makes the page jump while loading.
Fix: `Image` with `width` and `height`, or size classes.

**state set on every move or scroll** (Medium).
Fix: a ref, CSS (`position: sticky`, `:hover`), or `IntersectionObserver`.

**whole form watched** (Medium): `form.watch()`.
Every keystroke redraws the whole form.
Fix: `useWatch({ name })` in the small component that needs the value.

**font from another server**, **blocking script**, **CSS @import of a URL**
(Medium or Low).
Fix: a self-hosted `@fontsource-variable` package, `defer` or `type="module"`,
and imports in `main.tsx`.

**slow copy** (Low): `JSON.parse(JSON.stringify(x))`.
Fix: `structuredClone(x)`.

## Types and housekeeping

**any type** (Medium).
Fix: the real type, or `unknown` with a check. For API data, use the type from
`types/` and map it in the service.

**type check disabled** (Medium): `@ts-ignore`, `@ts-nocheck`.
Fix: fix the type. If a library type is wrong, use `@ts-expect-error` with a
reason.

**package not in package.json** (High).
AI tools invent package names.
Fix: check that the package exists on npm and is the right one. Then install it
with `resolve-versions.mjs`, or use what the project already has.

**fixed path in link** (Low): `to="/orders"`.
Fix: `ROUTES.orders.list`.

**disabled lint rule without reason** (Low).
Fix: fix the code, or add `-- reason` to the comment.

**console output** (Low), **unfinished note** (Low).
Fix: remove it, or use the project's logger. Finish the TODO, or list it in the
report.
