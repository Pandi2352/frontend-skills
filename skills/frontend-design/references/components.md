# Styling the parts

The shared components (`Button`, `Badge`, `Card`, `DataTable`, fields, `PageHeader`,
states) already use the tokens. Style through their props and the tokens. If a
part needs a new look everywhere, change the shared component once. Do not
override it in pages.

## Page

- `PageHeader` on every page: title, optional one-line description, a status
  badge beside the title, and actions on the right. One primary action, the
  others secondary or in a "More" menu.
- Below the header: filters or tabs, then the content. Keep this order on every
  page, so people learn it once.
- Data pages use the full width. Forms and reading text stay narrow
  (`max-w-2xl`), aligned left, not centered in the page.
- Detail pages: main content on the left (2/3), facts and actions in a side
  column (1/3) from `xl`. Stack them on phones.
- Sections inside a page get a small heading and space. Do not put every section
  in a card.

## Buttons

- `primary` once per view, for the main action. `secondary` for the others.
  `ghost` in toolbars and tables. `danger` only for destructive actions, and
  usually inside a confirm dialog.
- Label with a verb and an object: "Create invoice", not "Submit" or "OK".
- Leading icon only when it helps scanning (Add, Export, Filter). Not on every
  button.
- Button groups: the primary goes last on the right in dialogs and forms. Keep
  the same order everywhere.

## Cards

- Flat `surface`, 1 px `line` border, the radius token, 16 to 20 px padding.
- Header row: title (14 to 16 px, 600) left, a link or small menu right. Body
  below, with no second border inside.
- Use cards for things of the same kind (a grid of projects), or for a widget on
  a dashboard. Not as a wrapper for every block.
- A card that is clickable as a whole is a link, with a hover background or
  border color change only.

## Dashboard and stats

- Start with what needs action: overdue, failed, waiting for approval. Then
  totals and trends.
- Stat: label (12 to 13 px, muted), value (24 to 32 px, 600, `tabular-nums`),
  and an optional change with its period and a direction icon. Color the change
  by meaning (more errors is bad, even though it went up).
- Give the most important number more space. Not every stat needs a card. A row
  of stats in one card with dividers often looks cleaner.
- Sparklines and mini charts only when the trend matters.
- Charts: a title that says the insight, quiet gridlines, no 3D, no rainbow,
  direct labels instead of a legend when there are few series. More in
  `frontend-blocks` charts.

## Tables

- Quiet header: `subtle` background or none, 12 to 13 px, 500, muted.
- Lines between rows only, no vertical borders, no zebra stripes (except Dense
  tables with many columns).
- Numbers and amounts are right-aligned with `tabular-nums`. Text left. Status
  is a badge. Dates are short ("12 Mar"), with the full date in a tooltip.
- The first column is the name of the thing, strong and linked. IDs are mono and
  muted.
- Row actions: one visible icon button or a "⋯" menu at the right end, shown
  always (not only on hover, because touch screens cannot hover).
- Selected rows use `primary-subtle`. A bulk action bar replaces the toolbar
  while rows are selected.

## Badges and status

- Subtle style: tinted background, readable text in the status color, no
  border, or a 1 px border of the same tint.
- Small dot plus text for states that change (Active, Paused, Failed).
- A fixed map from domain status to badge variant, in one place in the
  feature. Never choose colors per page.
- At most 5 or 6 badge colors in the whole app.

## Forms

- Labels above fields, aligned left, in one column. Use two columns only for
  short related pairs (first and last name, city and postal code) from `md` up.
- Group long forms into sections, each with a heading and a one-line note on the
  left (from `lg`) and the fields on the right. This looks designed and is easy
  to scan.
- Field widths that hint at the content: postal code short, email long.
- Actions in a footer bar aligned right, sticky on long forms.
- Required is shown in the label. Help text sits under the field, in muted
  12 to 13 px.

## Lists and feeds

- Rows with an avatar or icon, a strong title, muted meta in one line, and the
  time on the right.
- Group by day ("Today", "Yesterday", "12 March") with small sticky headings.
- Unread items have a dot and a stronger title, not a colored background.

## Empty, loading, error

- Empty first use: a small illustration or icon in brand tints, a title that
  says what will be here ("No invoices yet"), one sentence on why it helps, and
  the primary action. Optionally a link to import or docs.
- Empty after a filter: "No orders match these filters", with "Clear filters".
  No illustration.
- Loading: skeletons in the shape of the content. Keep the page header and
  filters visible.
- Error: what failed, in plain words, with "Try again". Inline in the part that
  failed, not a full-page error.

## Modals and drawers

- Modal for short tasks (confirm, a small form). Drawer from the right for
  details or longer edits while the list stays visible.
- Title left, close button right, content, and a footer with actions on the
  right.
- Width from content: 400 px for confirms, 560 to 640 px for forms.

## Auth pages (login, register, reset)

- Split layout from `lg`: the form on one side (centered card, max 400 px), the
  other side a brand panel with the logo, one sentence about the product, and a
  calm brand-colored pattern or a real product screenshot. On phones only the
  form.
- No stock photos of people with laptops, and no floating blobs.

## Sidebar and navbar

Follow `frontend-core/references/layout-spec.md`. For the Bold direction, the
sidebar may use the brand color as its background, with on-primary text and a
lighter active item. Check the contrast of every text and icon on it.
