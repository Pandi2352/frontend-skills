---
name: frontend-accessibility
description: Makes React + TypeScript frontends usable for everyone and checks them against WCAG 2.2 AA - keyboard, focus, screen readers, labels, errors, contrast, zoom, motion, target size, dialogs, menus, tables, toasts, drag and drop. Use when building or checking any page or component, or for a11y, ARIA, WCAG, EAA or screen reader questions.
---

# Frontend accessibility

Goal: **WCAG 2.2 level AA**. In the EU, the European Accessibility Act asks for it
(EN 301 549) for many products sold since June 2025. Write it in from the start.
Fixing it at the end costs much more.

This skill has no code. It says what to do and how to check it. The components
from `frontend-core` already handle most of it, so use them and do not build
your own dialog, menu, select, tabs or date picker.

## Rules when writing any code

Structure
- One `h1` per page. Headings go in order, with no skipped levels.
- Use landmarks: `header`, `nav` with a name, `main`, `aside`, `footer`. The skip
  link goes to `main`.
- Use the real element first: `button` for actions, `a href` for navigation,
  `table` for tables, `ul` for lists. Use ARIA only when no element fits.
- `<html lang>` is set. A part in another language gets its own `lang`.
- Every route sets the page title (`Orders · App`).

Keyboard and focus
- Everything works with the keyboard alone, in a sensible order. No `tabIndex`
  above 0.
- Focus is always visible, with at least 3:1 contrast, and is never hidden behind
  a sticky header or footer.
- A dialog moves focus in, keeps it in, closes on Escape, and returns focus to the
  button that opened it.
- After a route change, focus goes to `main` or the `h1`. After deleting a row, it
  goes to the next row or the list.

Names and messages
- Every field has a visible label. A placeholder is not a label.
- An icon-only button has an `aria-label` that names the action ("Delete order
  1042", not "Delete").
- An error appears next to its field, is linked with `aria-describedby`, and the
  field gets `aria-invalid`. On submit, focus moves to the first error.
- Loading, saved and error messages that appear without a page change are
  announced with `role="status"` or `aria-live`. Toasts do this already.
- An image has `alt`. A decorative image or icon has `alt=""` or `aria-hidden`.

Seeing
- Text contrast is 4.5:1. Large text (24 px, or 18.5 px bold) is 3:1. Borders of
  fields, icons and chart lines are 3:1. Check both light and dark themes.
- Color is never the only signal. Add text, an icon or a pattern.
- At 400% zoom (320 px wide) nothing is cut off and nothing scrolls sideways,
  except tables and maps.
- Respect `prefers-reduced-motion`. Nothing flashes more than three times a
  second.

Pointer and time
- Click targets are at least 24×24 px, or have enough space around them.
- Anything done by dragging also works with a click or the keyboard.
- A timeout (idle logout, a session) warns first and lets the person extend it.
- Tooltips open on focus too, close on Escape, and stay open while the pointer
  is over them.

Forms
- Mark required fields in the label, not only with color.
- Use `autocomplete` for name, email, address, phone and passwords.
- Do not ask for the same information twice in one flow.
- Login allows paste and password managers, and has no puzzle that needs
  memory or transcription.

## Read only what the task needs

| Task | Read |
| --- | --- |
| Full WCAG 2.2 AA list by area, and what counts as a pass | `references/wcag-checklist.md` |
| Dialog, menu, combobox, tabs, table, toast, drag, charts, sidebar | `references/patterns.md` |
| Testing: lint, axe in tests, Playwright, keyboard and screen reader passes | `references/testing.md` |

## Checking a page or a project

1. Run the automated checks in `references/testing.md`: lint, axe in unit tests,
   and axe in the browser. Automated tools find only about a third of the
   problems.
2. Do a keyboard pass: Tab through the page, open and close everything, submit a
   form with errors.
3. Do a zoom pass: 200% text, then a 320 px wide window.
4. Do a screen reader pass on the main flow (NVDA or VoiceOver). Ask the user
   whether one is possible. If it is not, say it was not done.
5. If `frontend-review` is installed, run its scan as well.

Report a table of problem, WCAG number, where, and fix, with High for blockers
(cannot be reached, used or understood). Fix High first. Say what was not
checked. Never claim "fully accessible" or "WCAG compliant": say which checks
passed.
