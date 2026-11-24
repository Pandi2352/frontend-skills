import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  neutral: 'border-line bg-subtle text-foreground',
  primary: 'border-primary bg-primary-subtle text-primary',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
  info: 'border-info text-info',
};

export interface BadgeProps {
  variant?: keyof typeof variants;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

/** Always has text; color is only extra. */
export function Badge({ variant = 'neutral', size = 'md', icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 text-xs' : 'px-2 py-0.5 text-xs',
        variants[variant],
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-3.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
