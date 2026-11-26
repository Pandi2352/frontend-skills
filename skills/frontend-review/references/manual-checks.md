# Manual checks: what a scan cannot see

How to check each area from `SKILL.md`, quickly and in a way you can confirm.
Look only at the files in scope. Each item says how to check it, the usual
problem, and the fix.

## Reuse

- **How:** search for the component or function name and for a few distinctive
  classes or strings (`grep -rn "rounded-md border border-line p-4" src/features`).
  Read `docs/COMPONENTS.md` for what already exists.
- **Problems:** a local `Spinner`, `ConfirmDialog`, `formatMoney` or `useDebounce`
  next to the shared one. The same card markup in three pages. A shared component
  with props like `isOrdersPage`.
- **Fix:** use the shared one. Code used twice moves to `components/shared` or
  `utils`. A shared component with page-specific props gets a slot or
  `children` instead.

## Fields and forms

- **How:** open the form and follow one field from label to submit.
- **Check:**
  - Every field has a label, and the error sits directly below it.
  - All fields in one row have the same height.
  - Server 422 errors reach their fields (`setError`).
  - After a failed submit, focus goes to the first invalid field.
  - The submit button shows loading and cannot be clicked twice.
  - Values are kept when saving fails.
  - `autocomplete` is set on personal fields.
  - Leaving with unsaved changes warns (`unsaved-changes` block) when the form is
    long.
- **Fix:** `Form`, `FormField` and `FormActions` already do most of this. Wire
  the form through them instead of patching it by hand.

## States

- **How:** for each view, ask what it shows while loading, with no data, with
  no results for a filter, on error, without permission, and with very long
  text.
- **Fix:** `AsyncView` or skeletons in the content's shape, `EmptyState` with
  an action, `NoResults` with "Clear filters" for filters,
  `ErrorState` with retry, `ForbiddenPage`, and `truncate` with a tooltip.

## Accessibility

- **How:** Tab through the page without the mouse. Open and close every popup.
  Zoom to 200%. Check icon buttons for names.
- **Problems:** focus lost after closing a modal, a focus ring hidden by the
  navbar, status shown by color only, errors that are not announced, a heading
  jump from `h1` to `h4`.
- **Fix:** the patterns in `frontend-accessibility`, if it is installed.

## Layout

- **How:** widths 360, 768 and 1280, and dark theme if there is one. Use long
  names, 0 rows and 500 rows.
- **Problems:** the page scrolls sideways on phones, page actions overflow, the
  table has no own scroll region, text is cut off without a tooltip.
- **Fix:** `flex-wrap` and `min-w-0`, actions in a menu on phones, and the table
  inside its own scroll container.

## Code

- **How:** read the hooks and the effects in scope.
- **Problems:**
  - Server data copied into `useState`.
  - A request that can come back after a newer one (no `signal`, no query key with
    the filter).
  - An effect without cleanup.
  - Imports from another feature's internals (`features/a` importing
    `features/b/components/...`).
  - Paths and menu items written in pages instead of `config`.
  - Unsafe casts (`as Order`) on API data.
- **Fix:** TanStack Query with keys that include every filter, imports through
  the other feature's `index.ts` or moved to `shared`, `ROUTES`, `navigation.ts`,
  and mapping in the service.

## Performance

- **How:** in the network tab, or by reading the hooks, look for requests that
  wait for each other, and for one request per row. Look for state held at the
  top of a page that holds a big table.
- **Fix:** `useQueries` or `Promise.all`, a list endpoint that includes the
  needed fields, and moving state down into the small part that uses it. Measure
  before and after with `frontend-performance`.

## AI mistakes

- **How:** for every prop, endpoint, package and util that looks unfamiliar,
  check that it exists: `index-components.mjs <Name>` for props, the service file
  and the API docs for endpoints, `package.json` for packages.
- **Problems:**
  - A prop the component does not have.
  - An endpoint the backend never mentioned.
  - A test that asserts nothing.
  - A summary that says "all tests pass" with no run.
  - A file cut short.
- **Fix:** use the real prop or ask for it. List assumed endpoints in the report.
  Run the checks and paste the real result.

## Security

Follow the "Find it" lists in `frontend-security`, if it is installed. At least:
outside HTML and URLs, storage, `VITE_` values, `?redirect=` handling, and
permission checks that exist only in the UI.

## Must-have (whole project only)

Check `frontend-core/references/must-have.md`: toaster, error boundary, 404 and
403 pages, skip link, page titles, `.env.example`, tests, `verify` script,
provider order (`QueryClientProvider` outside `AuthProvider`), and
`react-router-dom` with routes in `src/app/router/`.
