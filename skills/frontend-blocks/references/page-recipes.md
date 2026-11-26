# Page recipes

The layout, the parts and the must-haves for common page types. Use the parts
that exist (`frontend-core` components and the blocks listed here) and write only
the page-specific glue. Every page has `PageHeader` (title, optional
description, badge, actions), and loading, empty and error states. Every page
is a lazy route, with its path in `ROUTES` and its menu entry in
`navigation.ts`.

Check the props with `node scripts/index-components.mjs <Name>` before using a
part.

## List

People find and act on many records.

```text
PageHeader: title · count · [Export] [New order]
Toolbar:    search · filters (status, date range) · saved views or tabs · column menu
DataTable:  name (link) · status badge · key number · key date · relation · row menu
            selection → bulk bar: [Change status] [Export] [Delete]
Pagination  or infinite list
```

- Parts: `DataTable` (sort, filter, paging, selection, `virtual` above 200 rows),
  `SearchInput`, `Dropdown` or `DateRangePicker` for filters, `Badge`,
  `DropdownMenu` for row actions, `NoResults`, `EmptyState`.
- Filters, sort, page and search live in the URL (`useUrlState`), so links and
  Back work.
- Empty first time: say what will be here, with "New …" and maybe "Import".
- Endless feed or log: the `infinite-list` block instead of paging.

## Detail

One record and everything about it.

```text
PageHeader: back · name · status badge · [Edit] [⋯ more]
Main (2/3):  Tabs or sections: Overview · Lines · Activity
Side (1/3):  facts (KeyValueList) · relations · dates · owner
```

- Parts: `Tabs`, `KeyValueList`, `Card`, `Timeline` for activity, `DataTable`
  for related rows, `useConfirm` for destructive actions.
- Actions depend on status and permission. Hide what is never allowed, and
  disable with a reason what is not allowed now.
- Not found (deleted or wrong id): `NotFoundPage` or an `ErrorState` with a link
  back to the list.
- Tabs in the URL (`?tab=lines`), so they survive reload.

## Create and edit form

```text
PageHeader: back · "New order" or "Edit order 1042"
Sections:   heading + note (left on lg) · fields (right)
Footer:     [Cancel] [Save]  (sticky on long forms)
```

- Parts: `Form`, `FormField`, fields, `FormActions`.
- Blocks: `unsaved-changes` for long forms, `autosave` for drafts and notes.
- After create: go to the new record's details. After edit: back to details,
  with a toast.
- A short form (3 or 4 fields) opens in a `Modal` from the list instead of a
  page.

## Wizard (steps)

A long task with an order: onboarding, checkout, a multi-part application.

```text
Stepper: 1 Details · 2 Items · 3 Review
Step content (one form per step)
Footer: [Back] [Next] → last step [Submit]
```

- Parts: `Stepper` and `useStepper`, one `Form` per step, validated on Next.
- Keep the data of all steps together, and keep it after Back. Save a draft
  (`autosave`) if it takes more than a few minutes.
- The review step shows everything with an "Edit" link per section.
- The step is in the URL (`?step=2`), and steps already done stay reachable.
- Use 3 to 5 steps. Fewer: one form with sections.

## Settings

```text
PageHeader: "Settings"
Side nav (lg) or Tabs (phone): General · Team · Billing · Notifications
Section: heading + note · fields · [Save] per section
Danger zone (last): delete or transfer, with typed confirm
```

- Block: `account-pages` (profile and settings) as the base.
- Save per section, not one big form. Show "Saved" with a toast, or inline
  next to the button.
- Toggles that apply at once (notifications) save on change, with undo on error.
- The danger zone uses `useConfirm` with `requireText`.

## Dashboard

- Block: `dashboard` (numbers, charts, recent rows, one period filter), with
  `charts`.
- Order: what needs action, then key numbers, then trends, then recent items.
- One period filter for the whole page, in the URL.
- Every number links to the list it comes from, already filtered.
- Each widget loads and fails on its own, with its own skeleton and retry.

## Report

Numbers for a period, to read, compare and export.

```text
PageHeader: title · [Export CSV] [Print]
Filters:    period · compare to · group by · segment
Summary:    3 to 5 totals with change vs the compared period
Chart:      one, the main trend
Table:      the rows behind it, totals row, sortable
```

- Parts: `charts` block, `DataTable`, `DateRangePicker`, `utils/csv` for export.
- All filters in the URL, so a report can be shared as a link.
- Heavy exports (XLSX, PDF) load their library only on click.
- Say where the numbers come from and when they were updated.

## Inbox and queue

Items arrive and people work through them: support tickets, messages,
notifications.

```text
Left (list):    tabs: Open · Mine · Done · search · items (unread dot, title, meta, time)
Right (detail): header with actions · thread or content · reply box
Phone: list, then detail as its own page
```

- Blocks: `notifications`, `realtime` for live updates, `infinite-list` for long
  lists.
- The selected item is in the URL (`/inbox/:id`). The list keeps its scroll
  position.
- Keyboard: ↑ and ↓ or J and K to move, Enter to open, E to mark done. Show the
  keys in a tooltip or help menu.
- After an action (done, assign), move to the next item.
- New items: a "3 new" button at the top, not a jump of the list.

## Approval queue

Requests that someone must approve or reject: leave, expenses, orders over a
limit.

```text
Tabs: Waiting for me (count) · All · Approved · Rejected
DataTable: request · requester · amount or dates · submitted · age · [Approve] [Reject]
Detail drawer: full request, attachments, history (Timeline), comment
```

- Parts: `DataTable` with selection for bulk approve, a drawer or `Modal` for
  details, `Timeline` for history, `useConfirm` for reject with a required
  reason.
- The approve and reject buttons check the permission, and the server checks it
  again.
- Approve with an optimistic update that rolls back on error. Show who approved
  and when.
- An old request (more than N days) gets a muted "waiting 5 days" hint, not a
  red alarm.

## Board and calendar

- `kanban` block: items by status, when moving between states is the main work.
  It also needs a "Move to" menu for keyboard users.
- `calendar` block: items by date, when the date is what people plan around.
- Both are extra views of a list. Link them with a view switch (List · Board ·
  Calendar) that keeps the filters.

## Import

- Block: `csv-import` (upload, column mapping, validation, preview, result).
- Entry: "Import" next to "New …" on the list, and in the empty state.
- Afterwards: a summary (created, skipped, errors), with a download of the
  failed rows.

## Auth and account

- Blocks: `auth-pages` (login, register, code, forgot, reset, change password),
  `account-pages` (profile, settings), `idle-logout`.
- Look: `frontend-design/references/components.md`, the auth pages section.

## Error and empty pages

- `StatusPages`: `NotFoundPage`, `ForbiddenPage`, `RouteErrorPage`. They are
  centered, with an SVG in theme colors. Already wired in the router.
- Empty states inside pages: `EmptyState` with a reason and an action.
  `NoResults` for filters.
