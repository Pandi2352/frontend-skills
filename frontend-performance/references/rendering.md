# Rendering

## Find the cause first

React DevTools, Profiler, "Record why each component rendered", in a production
profiling build or at least with the result compared to production. Typical
causes, most common first:

| Cause | Fix |
| --- | --- |
| State too high | move it down, or pass slow parts as `children` |
| Typing redraws a page | keep the text in the field component; send it debounced |
| New object, array or function given to memoized rows | outside the component, or memoize that value |
| One large context | split values that change from values that do not; memoize the value |
| Effect sets state from other state | compute while rendering |
| Too many elements | virtual list, paging |
| Heavy calculation on each render | `useMemo`, or a worker above about 50 ms |
| New `key` each render, index keys | stable id |
| Component defined inside a component | move it out |

## React Compiler

It memoizes automatically. The template passes all its tests with and without it.

| Installed Node | Use |
| --- | --- |
| 22.12 or newer | stable Babel version: `@rolldown/plugin-babel @babel/core babel-plugin-react-compiler`, `plugins: [react(), babel({ presets: [reactCompilerPreset()] })]` |
| 20.19 | Rust version: `oxc-transform-react`, `react({ compiler: true })`. Experimental; tell the user and let them choose |

Resolve versions with `resolve-versions.mjs --project -D …` and check the README of
the installed `@vitejs/plugin-react`, because this is still changing. Run all tests
with it on. Vitest uses the same Vite config.

With the compiler:
- Do not add `useMemo`, `useCallback` or `memo` for speed. Existing ones may stay.
- Never read a mutable object while rendering: `form.formState`, `ref.current`,
  class instances. The compiler keeps the old value. For forms use
  `useFormState({ control })` and `useWatch({ control, name })`.
- Virtualizers and some table libraries: `'use no memo'` as the first line of the
  component, with the reason.
- A component it skips still works, only without the gain. `logDiagnostics: true`
  lists them.
- A component misbehaves only with the compiler: it breaks a React rule. Fix it;
  use `'use no memo'` only for a moment.

## Tables

```tsx
const getUserId = (u: User) => u.id;                  // outside the component
const columns: Column<User>[] = […];

<DataTable virtual hidePagination columns={columns} getRowId={getUserId} … />
```

| 5,000 rows | all rows | `virtual` |
| --- | --- | --- |
| show | 4.5 s | 0.08 s |
| tick a checkbox | 90 ms | 13 ms |
| sort | 2 s | 0.07 s |

- Normal tables (paging) need nothing. `virtual` needs a scroll height
  (`scrollClassName`, default `max-h-128`) and column widths (`className: 'w-40'`).
- Row functions created in the component redraw every row on each click. Measured
  with 1,000 rows: 25 ms when stable, 224 ms when not. React Compiler solves this.
- Sorting 50,000 rows in the browser takes nearly a second: use `mode="server"`.
- With `virtual` the browser's find sees only visible rows, so keep the search box.

## Lists

`VirtualList`: measured heights, infinite loading, retry, keyboard scrolling,
positions for screen readers. Give it a height. Under 100 items use a normal list.
Long static pages: `content-visibility: auto` with `contain-intrinsic-size`.

Dropdowns show at most 300 matches and ask to narrow the search, so they need no
virtual list. Above about 2,000 options load them by search.

## Typing and filters

- `SearchInput onSearch` is already debounced.
- Filtering in the browser: `const slow = useDeferredValue(text)`, filter with
  `slow`, in a memoized child.
- Switching a heavy tab or view: `startTransition`, with `isPending` shown.
- Big forms: each `FormField` subscribes by itself. Keep it that way.

## Effects

Effects connect to something outside React. Each one that starts something
returns its cleanup:

```ts
useEffect(() => {
  const stop = new AbortController();
  window.addEventListener('resize', update, { signal: stop.signal });
  return () => stop.abort();
}, []);
```

Same for timers, observers, sockets (`close`), workers (`terminate`), file URLs
(`revokeObjectURL`), third-party widgets (`destroy`). Do not read layout
(`getBoundingClientRect`, `offsetHeight`) and write styles in the same loop.

## Heavy work

Above about 50 ms (parsing files, big calculations, image work): a worker.

```ts
const worker = new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' });
```

Create it on demand, send plain data, handle errors, terminate it.
