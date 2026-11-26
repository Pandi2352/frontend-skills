---
name: frontend-design
description: Gives React + Tailwind frontends a designed, modern look that does not seem AI-made - a style direction per project, brand colors, type, spacing, radius, depth, component styling, data display, empty states, motion and polish. Use when styling pages or components, theming, or when a UI looks generic, plain, flat or AI-generated.
---

# Frontend design

This skill has no code. It decides how a project looks and checks the result.
Change the look through tokens in `src/styles/theme.css` and through the
props of the shared components. Do not use one-off classes in pages.

**AI-made UIs look alike because every choice is the default:** the same font,
blue or purple, `rounded-xl` cards with shadows, gradients, emoji, three equal
cards, and everything centered. A designed UI comes from a few deliberate
choices that are applied everywhere the same way.

## Steps for a new project, or a restyle

1. **Know the product.** Who uses it, how often, on what screen, and how much
   data is on one page. Ask only what you cannot read from the request or the
   code.
2. **Pick one direction** from `references/visual-system.md` (Precise, Calm,
   Dense, Warm, Editorial, Bold) and say why in one line. Show the user the
   direction and 3 or 4 key tokens before changing many files.
3. **Build the tokens:** brand color scale, neutrals tinted toward the brand,
   semantic colors, font, type scale, radius, density, and dark mode. All of it
   goes in `theme.css` and `dark.css`.
4. **Style the parts** as `references/components.md` says: page header, cards,
   tables, forms, badges, stats, empty states.
5. **Polish** with `references/polish.md`: numbers, truncation, states, motion,
   and favicon.
6. **Check** against `references/anti-ai-look.md`. Fix every tell you find.

Existing project: keep its brand and its component library. Apply only steps
5 and 6 unless the user asks for a restyle.

## Rules when styling anything

Color
- One accent: the brand color. It marks the primary action, the active item,
  focus, links and selection. Everything else is neutral.
- Neutrals are slightly tinted toward the brand hue, not pure grey.
- Status colors (success, warning, danger, info) are only for status, never for
  decoration.
- No gradients on surfaces, text or buttons. A brand gradient may appear once,
  in the logo or on the login side panel, and only if the brand has one.

Shape and depth
- One radius for the whole app, set in the token. Fields, buttons and cards
  match it. Pills (`rounded-full`) are only for badges, avatars and toggles.
- Depth comes from surface color and 1 px borders. The frame and cards are flat.
  A shadow is allowed only on floating layers (menus, popovers, modals, toasts),
  and only if the direction uses one.
- No glass, blur, glow, neon, or 3D effects.

Type and space
- Hierarchy comes from size, weight and space, not from color or boxes.
- One font family, or at most one more for headings or numbers. Use 2 or 3
  weights.
- Spacing on the 4 px scale. Related things sit close together; groups are
  separated by more space, not by more borders.
- Left-align content in apps. Center only empty states, error pages and auth
  cards.

Content
- Real labels from the domain ("Overdue invoices", not "Items"). No lorem
  ipsum, no "Welcome back! 👋", no emoji in the interface, and no marketing
  words inside the app.
- Each page has one main action, styled as primary. Other actions are secondary
  or in a menu.

## Read only what the task needs

| Task | Read |
| --- | --- |
| Check a UI for the AI look, with a fix for each tell | `references/anti-ai-look.md` |
| Directions, brand colors, neutrals, dark mode, fonts, type scale, radius, density | `references/visual-system.md` |
| Page header, cards, tables, forms, buttons, badges, stats, charts, empty states, auth pages | `references/components.md` |
| Numbers, text, states, motion, icons, images, favicon, final pass | `references/polish.md` |
| Sidebar and navbar look | `frontend-core/references/layout-spec.md` |

## Done check

- [ ] Direction named, and tokens changed only in `theme.css` and `dark.css`
- [ ] No tell from `anti-ai-look.md` is left
- [ ] Contrast: text 4.5:1, borders of controls and focus 3:1, in both themes
- [ ] Screenshots at 360, 768, 1280 and 1600 px wide, with long names and empty
      data, look intentional
- [ ] `verify` passes

Report the direction, the main tokens and the screenshots taken. If
`frontend-accessibility` is installed, its contrast and target-size rules
override any style choice.
