# Testing accessibility

Automated checks catch about a third of the problems: missing names, contrast,
invalid ARIA. Keyboard, focus order, sense of the text and screen reader output
need a person or a scripted pass. Do both.

Install packages with `resolve-versions.mjs` from `frontend-core`, which matches
the versions to the project's Node, and never change Node. Write the test code
in the project. This skill has none to copy.

## 1. Lint, on every save

Projects from `frontend-core` already run `eslint-plugin-jsx-a11y-x` (the
original `jsx-a11y` does not support ESLint 10). Keep its `recommended` rules
on. It catches a missing `alt`, a click on a `div`, a bad `role`, and
`autoFocus` misuse.

## 2. Unit tests, with Testing Library and axe

- Query by role and name: `getByRole('button', { name: 'Save changes' })`. If a
  test cannot find an element that way, a screen reader cannot either. That is a
  bug, not a test problem.
- Test keyboard behaviour with `userEvent`: Tab order, Escape closes, focus
  returns, arrows move.
- Run axe on each shared component and page in its main states (default, open,
  error, empty). Use `axe-core` directly, or a small wrapper such as
  `vitest-axe`:

  ```ts
  import axe from 'axe-core';

  async function expectNoA11yViolations(container: HTMLElement) {
    const { violations } = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } }, // jsdom cannot see colors
    });
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  }
  ```

- Contrast cannot be tested in jsdom. Test it in the browser (step 3), or check
  the theme tokens once with a contrast tool for every text and background pair,
  in both themes.

## 3. In the browser, with Playwright and axe

If the project has Playwright (or the user agrees to add it), add
`@axe-core/playwright` and scan every main route, logged in, in light and dark,
and with dialogs open:

```ts
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();
expect(results.violations).toEqual([]);
```

Add a keyboard flow test for the main task: reach the menu, open a page, fill
the form only with keys, submit with errors, fix them, and save.

Lighthouse accessibility runs the same axe rules. A score of 100 does not mean
accessible.

## 4. Manual passes, about 10 minutes per page

Keyboard, with the mouse put away:
- [ ] The skip link appears on the first Tab and works
- [ ] Every control is reached, in reading order, with a visible ring that is
      never hidden under sticky bars
- [ ] Menus, dialogs, pickers and tabs follow `patterns.md`
- [ ] No trap. Escape closes what is open, and focus returns
- [ ] After navigation, focus goes to the new page

Zoom and size:
- [ ] Browser zoom at 200%: nothing is cut off or overlaps
- [ ] A 320 px wide window: no sideways page scroll, and the menu is reachable
- [ ] Text spacing bookmarklet: no text cut off

Look:
- [ ] Both themes: text, borders, focus and chart lines meet contrast
- [ ] Windows forced colors (contrast themes): borders and focus are still
      visible
- [ ] Reduced motion setting on: no big movement

Screen reader (NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on
Mac and iOS, TalkBack on Android):
- [ ] The page title and `h1` are read on arrival
- [ ] Headings list (NVDA `Insert+F7`, VoiceOver rotor) shows the page outline
- [ ] Every field reads its label, whether it is required, and its error
- [ ] Buttons and links say what they do, out of context
- [ ] "Saved", errors and result counts are announced
- [ ] Tables read the column headers with each cell

## 5. Reporting

| Problem | WCAG | Where | Severity | Fix |
| --- | --- | --- | --- | --- |
| Delete icon button has no name | 4.1.2 | `OrdersTable` row actions | High | `aria-label="Delete order {id}"` |

- **High**: someone cannot reach, use or understand a task. Keyboard traps,
  missing names on controls, and forms without labels are always High.
- **Medium**: possible but hard: low contrast, lost focus, unannounced errors.
- **Low**: annoying: heading order, redundant `title`, verbose names.

State which passes were done (lint, axe unit, axe browser, keyboard, zoom,
screen reader) and which were not. Only a full audit by people with disability
experience can confirm conformance. Say so if the user needs a VPAT or a legal
statement.
