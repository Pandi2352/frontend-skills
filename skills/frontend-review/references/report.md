# Review report

Use this shape every time, so reviews can be compared. Keep it short. The user
reads the table, not prose.

## Template

```markdown
## Review: <scope, e.g. "src/features/orders" or "changes since main">

**12 findings:** High 2 · Medium 7 · Low 3
**Checks:** types ok · lint ok · tests failed (2 of 214) · build ok · scan done

| # | Level | Where | Problem | Fix |
| --- | --- | --- | --- | --- |
| 1 | High | `OrderForm.tsx:42` | Native `<select>` for status | `Dropdown` with the status options |
| 2 | High | `OrdersPage.tsx:18` | Orders loaded in `useEffect`, no cancel; old results can replace new ones | `useOrders(filters)` query hook |
| 3 | Medium | 5 files in `features/orders` | Raw colors (`text-gray-500`, `bg-blue-50`) | `text-muted`, `bg-primary-subtle` |
| 4 | Medium | `OrdersTable.tsx` | No empty state for filters; shows a blank table | `NoResults` with "Clear filters" |
| … | | | | |

**Failing tests:** `OrderForm.test.tsx` › "shows server errors": the 422 field
errors are not mapped (finding 6).

**Not checked:** screen reader, the real backend (endpoints assumed: `GET
/orders`, `PATCH /orders/:id`), dark theme (the project has none).

Fix High and Medium now?
```

## Rules

- **Order:** High, then Medium, then Low. Within a level, the most used screens
  first.
- **Where:** `file:line` for one place, "N files in <folder>" for repeats. Group
  repeats into one row and keep the full list for the fix.
- **Problem:** what is wrong and, if not obvious, what happens to the user ("old
  results can replace new ones"). One line.
- **Fix:** the concrete change, naming the shared part or pattern. Not "improve
  error handling".
- **Checks:** real results from this run only. If a check could not run, say why.
  Never write "tests pass" without running them.
- **Not checked:** always present. List what was out of scope or impossible.
- No praise, no list of what is fine, no rule explanations. Link to `fixes.md`
  only if the user asks why.

## Levels

| Level | Meaning | Examples |
| --- | --- | --- |
| High | Broken, unsafe, or unusable for some people, or data can be lost | Request races, empty catch, XSS, token in storage, no keyboard access, native picker, code left out, invented package |
| Medium | Works, but breaks a visible standard, duplicates shared code, or will cause bugs or slowness later | Raw colors, raw fields, missing states, copied state, leaks, eager pages, `any` |
| Low | Cleanup | Index keys, console output, fixed paths, TODOs |

Raise a level when the problem is on a main flow (login, checkout, save).
Lower it in prototypes, if the user said so.

## After fixing

```markdown
**Fixed 9 of 12:** High 2 · Medium 7
**Checks:** types ok · lint ok · tests ok (214) · build ok · scan: High 0, Medium 0, Low 3

| # | Change |
| --- | --- |
| 1 | `OrderForm.tsx`: status uses `Dropdown` |
| 2 | `OrdersPage.tsx`: `useOrders` with filters in the key |
| … | |

**Left:** 3 Low (console output in `debug.ts` kept on purpose: it is dev only).
```

Every fix is verified by the scan and the checks. Report what is left and why.
