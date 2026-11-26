# Patterns

How each kind of widget must behave. These follow the WAI-ARIA Authoring
Practices (APG). If the project has `frontend-core` or `frontend-blocks`, the
listed part already does this. Use it, and check only what you add around it.
If you build one yourself, follow the keys and attributes here exactly.

ARIA rule: no ARIA is better than wrong ARIA. A `role` promises keyboard
behaviour. Add one only if you also build that behaviour.

## Dialog and drawer (`Modal`, `confirm`, mobile sidebar)

- `role="dialog"` with `aria-modal="true"`, named by its title
  (`aria-labelledby`).
- On open, focus goes to the first field, or to the dialog when it has no fields.
  For a confirm, focus goes to the safe button (Cancel).
- Tab stays inside the dialog. The page behind is `inert`.
- Escape closes it, unless that loses typed data, in which case ask first.
- On close, focus returns to the element that opened it. If that element is gone,
  such as a deleted row, focus goes to the list.
- Do not open a dialog on page load without a reason.

## Menu button (`DropdownMenu`, user menu, row actions)

- The button has `aria-haspopup="menu"` and `aria-expanded`.
- Enter, Space or ↓ opens the menu and focuses the first item. ↑ opens it on the
  last item.
- ↑ and ↓ move between items, Home and End jump, and typing a letter jumps to an
  item.
- Escape closes the menu and returns focus to the button. Tab closes it too.
- Items are `role="menuitem"`. Use links for navigation and buttons for actions,
  not both.
- Row actions name the row: `aria-label="Actions for order 1042"`.

## Select, combobox, multi-select (fields)

- Combobox: input with `role="combobox"`, `aria-expanded`, `aria-controls`, and
  `aria-activedescendant` for the highlighted option.
- Options are `role="option"` with `aria-selected`. Real focus stays in the input.
- ↓ and ↑ move, Enter selects, Escape closes, then Escape again clears if
  supported.
- Announce the result count ("5 results") through a live region.
- Multi-select chips each have a remove button named "Remove Paris".

## Tabs (`Tabs`)

- `role="tablist"`, `tab`, `tabpanel`. The tab has `aria-selected` and
  `aria-controls`, and the panel has `aria-labelledby`.
- Only the active tab is in the Tab order. ← and → move between tabs, Home and
  End jump.
- Tabs that change the URL are links in a `nav`, not `role="tab"`.

## Accordion and sidebar submenus

- The header is a `button` with `aria-expanded` and `aria-controls`.
- Collapsed content is `hidden` or `inert`, so it cannot be tabbed into.
- The current page link has `aria-current="page"`, and its parents start open.
- A collapsed icon-only sidebar has a name on each link (tooltip plus
  `aria-label`), and its fly-out works like a menu.

## Data table (`DataTable`)

- Use a real `table` with `th scope="col"` and a `caption`, or name it with
  `aria-labelledby` from the page heading.
- A sortable header is a `button` inside the `th`, and the `th` has `aria-sort`.
- The row select checkbox is named per row ("Select order 1042"). The select-all
  box says "Select all on this page".
- Paging, filtering and sorting announce the result: "Page 2 of 8", "12 orders".
- A clickable row also has a real link or button in it. A `tr` with `onClick` is
  not enough.
- A virtual table keeps `aria-rowcount` and `aria-rowindex`.
- Scrolling sideways is allowed for wide tables, with a focusable scroll region
  (`tabIndex={0}`, `role="region"`, and a name).

## Toast and live messages (`toast`)

- Info and success use `role="status"` (polite). Errors that block use
  `role="alert"`.
- A toast stays at least 5 s, pauses on hover and focus, and can be closed.
  A toast with an action ("Undo") also offers that action somewhere else, or
  stays until closed.
- Do not move focus to a toast.
- The live region exists before the message is put in it, or it is not read.

## Tooltip (`Tooltip`)

- Opens on hover and on focus, closes on Escape, and stays while hovered.
- It is linked to its trigger with `aria-describedby`. A tooltip is extra
  information, never the only name, except on icon buttons that also have
  `aria-label`.
- Nothing clickable goes inside a tooltip. Use a popover or dialog for that.

## Forms (`Form`, all fields)

- Visible `label` linked by `htmlFor`. Help text and errors are linked by
  `aria-describedby`, in that order.
- Mark required fields with text or `*` in the label plus `aria-required`, and
  explain the `*` once at the top.
- On a failed submit, focus the first invalid field. With more than 3 errors,
  also show a summary at the top that links to each field.
- Do not disable the submit button while the form is invalid. Let people submit
  and see the errors.
- Radios and checkbox groups go in `fieldset` with a `legend`.
- Date, phone and currency fields accept typing, not only picking.

## Drag and drop (kanban, sortable list, file drop, resizers)

- Every drag has another way: a "Move to" menu, ↑ and ↓ buttons, or keyboard
  pick up (Space), move (arrows), drop (Space), cancel (Escape).
- Announce each step: "Picked up Order 1042. Over column Paid. Dropped."
- A file drop zone is also a button that opens the file picker.

## Charts

- Each chart has a heading and a one-line text summary of what it shows
  ("Sales grew 12% since May").
- Offer a table view or a download for the numbers.
- Series differ by more than color: labels at line ends, patterns, or markers.
- Tooltips that show values can also be reached by keyboard, or the same values
  are in the table.

## Command menu, search (`command-menu`)

- Opens with the shortcut and from a visible button. It is a dialog containing a
  combobox.
- Show the shortcut as text in the button (`Ctrl K`), so people can find it.

## Loading, empty, error states (`states`)

- Spinners and skeletons have hidden text "Loading orders" and `aria-busy` on
  the region.
- When loading ends, the new content is not announced as a whole. Announce a
  short status instead ("12 orders loaded") only when it helps.
- Error states say what happened and offer a retry button.

## Icons and images

- Phosphor and Lucide icons next to text get `aria-hidden`.
- Icon-only buttons: `aria-label` on the button, not on the icon.
- Avatars: `alt` with the person's name, or `alt=""` when the name is shown next
  to it.
- An SVG illustration on an error page is decorative (`aria-hidden`). The text
  carries the meaning.
