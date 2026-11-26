# Visual system

Every look decision becomes a token in `src/styles/theme.css`, plus the same
names under `[data-theme='dark']` in `dark.css` when dark mode exists (the
`frontend-blocks` dark mode block). Components already use these tokens, so a
restyle changes these files and nothing else. Never rename a token, because the
components depend on the names.

## 1. Pick a direction

Pick one per project, from what the product is. It sets the defaults for
everything below. Name it to the user in one line, for example: "Dense, because
the team works in tables all day."

| Direction | For | Radius | Density | Font idea | Depth | Feel |
| --- | --- | --- | --- | --- | --- | --- |
| **Precise** | Dev tools, finance, analytics | 4 to 6 px | Compact | Geist, IBM Plex Sans, Inter with tabular numbers | Borders only | Sharp lines, monospace for IDs and numbers, few colors |
| **Calm** | Admin panels, HR, health, education | 8 px | Comfortable | Source Sans 3, Public Sans, Figtree | Borders, very light overlay shadow | Soft neutrals, more space, gentle accent |
| **Dense** | Operations, logistics, support queues, trading | 4 px | Compact (32 px rows) | IBM Plex Sans, Roboto Flex, Inter | Borders only | Many rows on screen, small labels, strong alignment |
| **Warm** | Small business, booking, consumer accounts | 10 to 12 px | Comfortable | Nunito Sans, Onest, DM Sans | Light overlay shadow | Warm neutrals (stone), friendlier accent, rounder |
| **Editorial** | Content, CMS, knowledge base, reports | 2 to 6 px | Comfortable | Serif headings (Source Serif 4, Fraunces) with a sans body | Borders, rules between sections | Big type contrast, reading widths, quiet UI |
| **Bold** | Brand-led products, marketing-heavy apps | 6 to 8 px | Comfortable | Manrope, Bricolage Grotesque headings, Inter body | Borders | Strong brand color on large areas (sidebar or header), very calm content |

Do not mix directions. If the user has a brand guide or a website, follow it
first, and use the table only for what the guide does not say.

## 2. Brand color and its scale

Start from the project color (`create.mjs --color`, the logo, or the brand
guide). Build the tokens in OKLCH, so each step looks equally light:

| Token | From the brand color |
| --- | --- |
| `--color-primary` | The brand color. Raise or lower lightness until white text on it is 4.5:1 |
| `--color-primary-hover` | Lightness about 0.06 lower |
| `--color-primary-subtle` | Same hue, lightness about 0.97, low chroma. Used for selected rows, active menu, and badges |
| `--color-focus` | Primary, or a stronger version if primary is light |
| `--color-on-primary` | White, or near black if the brand color is light (yellow, lime, cyan) |

```css
--color-primary: oklch(0.52 0.15 165);
--color-primary-hover: oklch(0.46 0.15 165);
--color-primary-subtle: oklch(0.97 0.02 165);
```

A brand color that fails contrast as a button (yellow, light green) stays in the
logo and in accents, and the buttons use a darker step of the same hue.

## 3. Neutrals tinted toward the brand

Pure grey looks generic. Give every neutral the brand hue at very low chroma
(0.005 to 0.015):

| Token | Light, lightness about | Use |
| --- | --- | --- |
| `--color-page` | 0.985 | Area behind content |
| `--color-surface` | 1.0 | Sidebar, cards, tables, fields |
| `--color-subtle` | 0.965 | Hover, selected, disabled, table header |
| `--color-line` | 0.92 | Dividers, card borders |
| `--color-control-line` | 0.62 | Field borders, 3:1 against the surface |
| `--color-muted` | 0.45 | Labels, helper text, idle icons, 4.5:1 |
| `--color-foreground` | 0.21 | Text, values, titles |

For Warm, shift the hue toward 60 to 80 (stone). For Precise and Dense, use
chroma close to 0.

## 4. Status colors

Keep `success`, `warning`, `danger` and `info` readable as text on `surface`
(4.5:1), and give each a subtle background step for badges and alerts. Adjust
their hues so they do not clash with the brand. With a green brand, make
success a different green or a teal, so "active menu item" and "success" are not
confused.

## 5. Dark mode

- Own values, never inverted. Surfaces are dark grey tinted toward the brand
  (lightness about 0.16 for `page`, 0.20 for `surface`, 0.24 for `subtle`), not
  black.
- Higher surfaces are lighter: popovers and modals one step lighter than cards.
- Text is off-white (about 0.95), `muted` about 0.75.
- The primary color is lighter and less saturated than in light mode. Text on
  it is usually dark.
- Borders do more work than in light mode, because shadows barely show.
- Check every pair for contrast again. Charts need their own dark tints.

## 6. Font

- Choose from the direction. Load it as a variable font through
  `@fontsource-variable/<name>`, installed with `resolve-versions.mjs`, and
  set `--font-sans`.
- If `frontend-performance` is installed, update the fallback numbers in
  `styles/fonts.css` for the new font, so the text does not jump.
- At most two families. A second one is only for headings (Editorial, Bold) or a
  mono for IDs, codes and amounts (`--font-mono`: Geist Mono, IBM Plex Mono,
  JetBrains Mono).
- Turn on useful OpenType features: tabular numbers in tables and stats
  (`tabular-nums`). Some fonts also have `cv11` and `ss01` alternates that make
  the font look less default.

## 7. Type scale

App UI needs few sizes. Keep the template classes and set the steps by
direction:

| Role | Compact | Comfortable | Weight |
| --- | --- | --- | --- |
| Page title (`h1`) | 20 to 22 px | 24 to 28 px | 600 |
| Section title | 16 px | 18 px | 600 |
| Card title, table header | 13 to 14 px | 14 to 15 px | 500 to 600 |
| Body, fields, table cells | 13 to 14 px | 14 to 15 px | 400 |
| Label, helper, meta | 12 px | 12 to 13 px | 400 to 500 |
| Group label (sidebar, sections) | 11 px uppercase, letter spacing 0.04em | same | 500 to 600 |
| Big stat number | 24 to 28 px | 28 to 32 px | 600, tabular |

Headings get tighter letter spacing (`tracking-tight`) from 20 px up. Body text
line height is 1.5. Headings use 1.2 to 1.3. Keep fields at 16 px on phones, so
iOS does not zoom.

## 8. Radius

Tailwind v4 reads `--radius-md` from `@theme`. The components use `rounded-md`,
so setting that one token changes the whole app:

```css
@theme { --radius-md: 0.375rem; } /* 6 px, Precise */
```

Large containers (modals, side panels) may use one step bigger
(`--radius-lg`), never smaller than their content.

## 9. Density

Density comes from the control height tokens and the page padding:

| | Compact | Comfortable |
| --- | --- | --- |
| `--spacing-control` | 2.25rem (36 px) | 2.5rem (40 px) |
| `--spacing-control-sm` | 1.75rem | 2rem |
| Table row | 36 px | 44 to 48 px |
| Page padding | `p-4 md:p-5` | `p-4 md:p-6 xl:px-8` |
| Gap between cards | 12 px | 16 to 24 px |

Keep clickable targets at 24 px or more, even when compact.

## 10. Depth

The default is flat: `page` behind, `surface` on top, 1 px `line` borders.
Directions with an overlay shadow add one token, used only by floating layers:

```css
--shadow-overlay: 0 1px 2px oklch(0.2 0.02 165 / 0.06), 0 8px 24px oklch(0.2 0.02 165 / 0.08);
```

The shadow is tinted with the brand hue and is never black and heavy. Cards,
the sidebar and the navbar never get it.

## 11. Icons

- One icon set for the product. The menu uses Phosphor duotone (layout spec).
  Inline UI icons stay small and outline.
- Sizes: 16 px in controls, 20 px in the menu, 24 px or more only in empty
  states.
- The icon stroke weight should match the font weight: thin fonts with light
  icons, heavier fonts with regular ones.

## Write it down

Add a short `docs/DESIGN.md` in the project: the direction, the brand color, the
font, the radius, the density, and what not to do. Later sessions and other
tools then keep the same look.
