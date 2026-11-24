import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge must know the custom sizes from theme.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['control', 'control-sm', 'control-lg', 'header', 'sidebar', 'sidebar-collapsed'],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
