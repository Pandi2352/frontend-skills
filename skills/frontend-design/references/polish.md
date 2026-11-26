# Polish

Small details are most of the difference between "generated" and "designed".
Go through this list at the end of every UI task.

## Numbers and data

- `tabular-nums` on every number that is compared or changes: tables, stats,
  timers, money.
- Format with `Intl` (and `utils/date`, `appConfig` locale and currency). Use the currency symbol,
  thousands separators, and the same number of decimals in one column.
- Short forms for big numbers in stats (`12.4k`), with the full value in a
  tooltip.
- Relative time for recent things ("5 min ago"), the date for older ones, and
  the full date and time on hover.
- No `NaN`, `undefined`, `null` or `Invalid Date` on screen. Use an em dash (—)
  for a missing value.

## Text

- Long names are truncated with an ellipsis and the full text in a tooltip
  (`truncate` plus `min-w-0` on the flex child). Test with a 60-character name.
- Headings use `text-balance`, and paragraphs use `text-pretty`, so lines do
  not end with one word.
- Reading text is at most about 70 characters wide.
- Use curly quotes (’ “ ”), the ellipsis character (…), the multiplication sign
  (×), and an en dash (–) in ranges like 10–20.
- No trailing periods in labels, buttons or table headers. Full sentences in
  descriptions and messages.

## States for every interactive part

Default, hover, focus-visible, active (pressed), selected, disabled, loading,
error, read-only. The shared components have them. Custom parts need all of
them too.

- Hover changes the background or the border, not the size or position.
- Pressed: one step darker, or `scale-[0.98]` on buttons only, and only if the
  direction is lively.
- Loading buttons keep their width, and the label changes ("Saving…").
- Selected and active states look the same in the menu, tabs and rows: the
  primary-subtle background, primary text or a side bar.

## Motion

- 120 to 200 ms, `ease-out` on enter, a little faster on exit. Only `transform`
  and `opacity`.
- Animate what changes state: menus and popovers (fade plus 4 px slide), modals
  (fade plus a small scale), drawers (slide), submenus (height through grid
  rows), toasts.
- New rows can fade in. Removed rows collapse. The rest does not animate.
- Everything off under `prefers-reduced-motion`.

## Icons and images

- Icons are optically centered with the text (`size-4` with `text-sm`,
  `size-5` in the menu), and the gap is the same everywhere (`gap-2`).
- Icon buttons are square, as tall as the controls, with a tooltip.
- Images and avatars have fixed sizes and `object-cover`. Logos use
  `object-contain` on a neutral tile.
- Illustrations are SVG in theme colors (`fill-primary`, `fill-primary-subtle`,
  `stroke-line`), so they follow the brand and dark mode. One style for all of
  them.

## Small app details

- Favicon and `theme-color` from the brand (`index.html`). Set the app name in
  the tab title on every page.
- Text selection color in the brand tint: `::selection` with `primary-subtle`.
- Thin, quiet scrollbars inside panels (`scrollbar-width: thin`,
  `scrollbar-color`). Leave the page scrollbar alone.
- `accent-color` set to primary, so native parts that remain (progress) follow
  the brand.
- Keyboard shortcuts shown as `kbd` tags in menus and tooltips.
- The cursor is `pointer` only on links and buttons that act. Text stays
  selectable.

## Responsive

- Check at 360, 768, 1024, 1280 and 1600 px.
- Phones: the page header stacks, actions move into a menu except the primary,
  and tables become cards or scroll sideways in their own region.
- Wide screens: data stretches. Do not leave half the screen empty, and do not
  stretch text lines.

## Final pass

1. Take screenshots of the main pages: light and dark, phone and desktop, with
   data, empty and loading.
2. Squint at each one. Does one thing stand out first, and is it the right
   thing?
3. Compare two pages side by side. Are the header, spacing, buttons and tables
   identical in style?
4. Run the `anti-ai-look.md` table once more.
5. Run `verify`.
