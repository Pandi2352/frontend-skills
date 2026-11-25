---
name: frontend-performance
description: Makes React + Vite frontends fast and keeps them fast - bundle size, lazy loading, re-renders, React Compiler, long lists and tables, slow typing, images, fonts, request waterfalls, memory leaks, Lighthouse, web vitals, caching, hosting. Use when an app is slow, laggy, heavy or jumping, or for charts, maps, editors and big lists.
---

# Frontend performance

Finished code; do not open or retype `assets/`. Projects made with `create.mjs`
already have it: skip "Set up".

**Measure, change one thing, measure again.** Report both numbers. Without a
measured problem, follow the rules below and add nothing else: no extra memo,
cache, worker or library.

## Targets

| What | Real visits (75%) | Lab (phone, slow network) |
| --- | --- | --- |
| LCP, main content visible | 2.5 s | 3 s |
| INP, reaction to a click or key | 200 ms | TBT 200 ms |
| CLS, jumping | 0.1 | 0.1 |
| First load, compressed | | 170 kB JS, 20 kB CSS |
| Each lazy page, compressed | | 80 kB |

They are in `performance.budget.json`. When something is over, fix it. Raise a
limit only if the user agrees.

## Set up

1. `node <skill>/scripts/add-to-project.mjs <project>` (never overwrites).
2. Install `@tanstack/react-virtual web-vitals @fontsource-variable/inter` and
   dev `lighthouse` with `resolve-versions.mjs` from frontend-core
   (`--project ... -D lighthouse`). Do not change Node.
3. `vite.config.ts`: `import { performanceBuild } from './vite.performance.ts'` and
   `build: performanceBuild`.
4. `main.tsx`, after the router exists:

   ```tsx
   import '@fontsource-variable/inter';
   import '@/styles/fonts.css';
   import '@/styles/index.css';

   preloadOnIntent(routes);                       // lib/preload-routes
   recoverFromStaleDeploy(router, () =>           // lib/stale-deploy
     toast.info('A new version is available', { id: 'new-version', action: { label: 'Reload', onClick: () => location.reload() } }));
   reportWebVitals(sendVitalTo('/vitals'));       // lib/web-vitals; only if something receives them
   ```

   Keep the route list in a `routes` constant, so it can be passed to both
   `createBrowserRouter` and `preloadOnIntent`. Another font: change `fonts.css`.
5. Scripts in `package.json`:
   `"size": "node scripts/performance/check-size.mjs"`,
   `"measure": "node scripts/performance/measure.mjs"`.
6. Hosting: take the matching file from `assets/hosting`.
7. React Compiler: `references/rendering.md`. Ask once; not required.

Existing project: do only the steps that fit, and say which you skipped.

## Rules when writing any code

Loading
- Every page is a lazy route. Modals, charts, editors, maps, exports and PDF load
  when opened or near the screen (`React.lazy`, `LazySection`).
- No whole-library imports. Check the cost of a new package before adding it.

Rendering
- State lives as low as possible. One component must not own everything.
- Values that can be computed are computed while rendering, not put in state by
  an effect.
- `useMemo`, `useCallback`, `memo` only for memoized rows, effect dependencies,
  context values, or a measured problem.
- More than 100 list items or 200 table rows on screen: `VirtualList`,
  `<DataTable virtual>`, or paging on the server.
- `columns`, `rowActions` and `getRowId` of a table: outside the component, or
  `useMemo`/`useCallback`.
- Forms: `useWatch` and `useFormState` in the small part that needs them. Never
  `form.watch()` at the top.
- Never set state on scroll or mouse move. Use CSS, refs or observers.

Data
- Independent requests run together. No request waits for another without need.
- Pass `signal`; search is debounced; pages and filters keep the old rows while
  loading. Server paging above about 500 rows.

Stability
- Image and skeleton have the size of the final content. Use `Image`.
- Animate only `transform` and `opacity`.
- Every listener, timer, observer, socket and file URL is cleaned up.

## Read only what the task needs

| Problem | Read |
| --- | --- |
| Slow first load, bundle, images, fonts, third-party scripts | `references/loading.md` |
| Slow clicks or typing, re-renders, lists, React Compiler, workers | `references/rendering.md` |
| Slow or repeated requests, caching, infinite scroll | `references/data.md` |
| Measuring, finding the cause, memory leaks, hosting, CI | `references/measure.md` |

## Fixing something slow

1. Ask what is slow only if it is unclear: first load, a click, typing, scrolling,
   or it gets worse over time.
2. Measure: first load `build`, `size`, `measure`; interaction the React Profiler
   or a timing script; over time `check-leaks.mjs`. Numbers come from the
   production build, never from the dev server.
3. If `frontend-review` is installed, run its `scan.mjs`: it finds missing
   cleanups, eager pages, heavy imports and images without size.
4. Fix the biggest cause first. Keep behaviour and accessibility.
5. Measure the same way again. Undo a change that did not help.

Finish with `node scripts/verify.mjs`. Report a short table:
what, before, after. Say what was not measured.
