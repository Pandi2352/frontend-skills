# WCAG 2.2 AA checklist

Every level A and AA rule, grouped by what you build. The number is the WCAG
success criterion, so a report can name it. **New in 2.2** marks the rules most
older checklists and AI answers miss. 4.1.1 Parsing was removed in 2.2, so do
not report it.

## Page

| # | Rule | Pass when |
| --- | --- | --- |
| 2.4.2 | Page titled | Each route sets a unique `document.title` |
| 3.1.1 | Language of page | `<html lang="en">` matches the content, and changes with the app language |
| 3.1.2 | Language of parts | A quote or name in another language has `lang` |
| 1.3.1 | Info and relationships | Headings, lists, tables and landmarks are real elements, not styled `div`s |
| 2.4.1 | Bypass blocks | A skip link goes to `main`, and landmarks exist |
| 2.4.6 | Headings and labels | Headings and labels describe the content |
| 1.3.2 | Meaningful sequence | The DOM order reads correctly with CSS turned off |
| 3.2.3 | Consistent navigation | The menu is in the same place and order on every page |
| 3.2.4 | Consistent identification | The same action has the same name and icon everywhere |
| 3.2.6 | **New in 2.2.** Consistent help | Help, contact or chat is in the same place on every page |
| 2.4.5 | Multiple ways | At least two ways to reach a page, such as the menu plus search or links |

## Keyboard and focus

| # | Rule | Pass when |
| --- | --- | --- |
| 2.1.1 | Keyboard | Every action works by keyboard, including custom widgets and charts that have actions |
| 2.1.2 | No keyboard trap | Focus can always leave, except inside an open modal, which closes on Escape |
| 2.1.4 | Character key shortcuts | A single-letter shortcut can be turned off, or works only while focused |
| 2.4.3 | Focus order | Tab order follows the reading order. Focus moves into opened dialogs and drawers |
| 2.4.7 | Focus visible | Every focusable element shows a ring (`focus-visible`) |
| 2.4.11 | **New in 2.2.** Focus not obscured | A sticky header, footer, cookie bar or toast never fully covers the focused element. Use `scroll-padding-top` |
| 3.2.1 | On focus | Focusing does not open, submit or move anything |
| 3.2.2 | On input | Changing a field does not submit or navigate without a warning |

## Text, color and layout

| # | Rule | Pass when |
| --- | --- | --- |
| 1.4.3 | Contrast | 4.5:1 for text, 3:1 for 24 px or 18.5 px bold text. This includes placeholder, disabled-looking active text, and text on images |
| 1.4.11 | Non-text contrast | Field borders, checkbox outlines, focus rings, icons that carry meaning, and chart lines are 3:1 against what is next to them |
| 1.4.1 | Use of color | Error, status, links in text and chart series also differ by text, icon, underline or pattern |
| 1.4.4 | Resize text | 200% browser zoom: nothing is cut off or overlaps |
| 1.4.10 | Reflow | A 320 px wide window has no sideways scrolling, except data tables, maps and diagrams |
| 1.4.12 | Text spacing | Larger line, letter and word spacing does not cut off text. Avoid fixed heights on text boxes |
| 1.4.5 | Images of text | Real text, not pictures of text |
| 1.3.4 | Orientation | Works both upright and sideways |
| 1.4.13 | Content on hover or focus | Tooltips and popovers close on Escape, can be hovered, and stay until moved away |

## Images, media and motion

| # | Rule | Pass when |
| --- | --- | --- |
| 1.1.1 | Non-text content | `alt` says what matters. Decorative images and icons use `alt=""` or `aria-hidden`. Charts have a text summary or table |
| 1.2.x | Media | Videos have captions. Audio has a transcript. No autoplay with sound |
| 2.2.2 | Pause, stop, hide | A carousel, ticker or animation over 5 s can be paused |
| 2.3.1 | Three flashes | Nothing flashes more than three times a second |
| (2.3.3, AAA) | Animation from interactions | Respect `prefers-reduced-motion`. It costs little, so do it |

## Forms

| # | Rule | Pass when |
| --- | --- | --- |
| 1.3.1, 4.1.2 | Labels | Every field has a programmatic label. Groups such as radios use `fieldset` and `legend` |
| 2.5.3 | Label in name | The accessible name contains the visible label text, so voice control works |
| 3.3.2 | Labels or instructions | Required fields and formats ("DD/MM/YYYY") are shown before typing |
| 1.3.5 | Input purpose | `autocomplete` on personal fields: `name`, `email`, `tel`, `street-address`, `current-password`, `new-password`, `one-time-code` |
| 3.3.1 | Error identification | The error says what is wrong in text, next to the field, linked with `aria-describedby` |
| 3.3.3 | Error suggestion | The error says how to fix it ("Use 8 or more characters") |
| 3.3.4 | Error prevention | Payments, deletes and legal submits can be checked, confirmed or undone |
| 3.3.7 | **New in 2.2.** Redundant entry | Data typed earlier in the flow is filled in or can be chosen, such as "Same as billing address" |
| 3.3.8 | **New in 2.2.** Accessible authentication | No memory or puzzle test to log in. Allow paste, password managers, passkeys and magic links |

## Pointer and touch

| # | Rule | Pass when |
| --- | --- | --- |
| 2.5.1 | Pointer gestures | Pinch and swipe also have buttons |
| 2.5.2 | Pointer cancellation | Actions run on release, not on press |
| 2.5.4 | Motion actuation | Shake or tilt actions also have a button |
| 2.5.7 | **New in 2.2.** Dragging movements | Kanban, sortable lists, sliders and resizers also work by click or keyboard |
| 2.5.8 | **New in 2.2.** Target size (minimum) | Targets are at least 24×24 CSS px, or a 24 px circle around each does not touch another target. Check table row actions, pagination and close icons |

## Time and state

| # | Rule | Pass when |
| --- | --- | --- |
| 2.2.1 | Timing adjustable | Idle logout and timers warn at least 20 s before and can be extended |
| 4.1.2 | Name, role, value | Custom widgets expose role, name and state (`aria-expanded`, `aria-selected`, `aria-checked`, `aria-current`) |
| 4.1.3 | Status messages | "Saved", "3 results", "Upload failed" and similar are announced without moving focus |

## Not required but expected

- Respect `prefers-reduced-motion` and `prefers-color-scheme`. Forced colors
  (Windows high contrast) keep borders and focus rings, so use
  `forced-colors:` variants if needed.
- Help pages and messages in plain language.
- AAA target size (44×44) on touch-first screens.
