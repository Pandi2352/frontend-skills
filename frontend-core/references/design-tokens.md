# Design tokens

All visual values live in `src/styles/theme.css` (in the template; the list below
is a summary). To rebrand, change only this
file. Recheck contrast after changing colors: text 4.5:1, control borders 3:1.

```css
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  --color-page: #f8fafc;
  --color-surface: #ffffff;
  --color-subtle: #f1f5f9;          /* hover, selected, disabled */
  --color-foreground: #0f172a;
  --color-muted: #475569;
  --color-placeholder: #64748b;
  --color-line: #e2e8f0;            /* cards, dividers */
  --color-control-line: #858fa1;    /* field borders, 3:1 */

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-on-primary: #ffffff;
  --color-secondary: #e2e8f0;
  --color-secondary-hover: #cbd5e1;
  --color-on-secondary: #0f172a;
  --color-success: #15803d;
  --color-warning: #b45309;
  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;
  --color-on-danger: #ffffff;
  --color-info: #0369a1;
  --color-focus: #2563eb;
  --color-backdrop: rgb(15 23 42 / 0.5);

  /* shared by every field and button */
  --spacing-control-sm: 2rem;       /* 32px */
  --spacing-control: 2.5rem;        /* 40px, default */
  --spacing-control-lg: 3rem;       /* 48px */

  /* app shell */
  --spacing-header: 3.5rem;
  --spacing-sidebar: 16rem;
  --spacing-sidebar-collapsed: 4rem;
}

:root {
  --z-sticky: 10;  --z-sidebar: 20;  --z-navbar: 30;
  --z-drawer: 40;  --z-modal: 50;    --z-popover: 60;
  --z-toast: 70;   --z-tooltip: 80;
}
```

Usage: `h-control`, `min-h-control`, `w-sidebar`, `h-header`, `bg-surface`,
`text-muted`, `border-line`, `z-(--z-modal)`.

Dark theme, only if required: override the same `--color-*` variables under
`[data-theme='dark']`. Components must not need `dark:` classes.

## `lib/cn.ts`

tailwind-merge must know the custom sizes, or overrides will not work.

```ts
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        'control', 'control-sm', 'control-lg',
        'header', 'sidebar', 'sidebar-collapsed',
      ],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

## Scales

| Area | Standard |
| --- | --- |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px |
| Field stack gap | `gap-1.5` inside a field, `gap-4` between fields |
| Page padding | `p-4 md:p-6` |
| Page title / section / card title | `text-2xl` / `text-lg` / `text-base`, semibold |
| Body / helper and error | `text-sm` / `text-xs` |
| Field text | `text-base md:text-sm` (16px on mobile stops iOS zoom) |
| Weights | 400, 500, 600 |
| Icons | 16px in controls, 20px in navigation |
| Widths | form `max-w-2xl`, page `max-w-7xl` |
| Breakpoints | Tailwind defaults, sidebar visible from `lg` |
| Motion | 150ms `ease-out`; respect `prefers-reduced-motion` |
| Focus | `focus-visible:outline-2 outline-offset-2 outline-focus` |
| Hover | one step darker, or `bg-subtle` |
| Disabled | `bg-subtle text-muted cursor-not-allowed` |

Touch targets: 24px minimum, 40px or more preferred on mobile. Every heading
level is in order, with one `h1` per page.
