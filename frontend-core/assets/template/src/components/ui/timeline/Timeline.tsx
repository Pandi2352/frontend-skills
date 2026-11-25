import { Circle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  neutral: 'border-control-line text-muted',
  primary: 'border-primary text-primary',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
};

export interface TimelineItem {
  id: string;
  title: ReactNode;
  /** Shown text; `dateTime` is the exact time for machines. */
  time?: string;
  dateTime?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
}

export interface TimelineProps {
  label: string;
  /** In the order they should be read. */
  items: TimelineItem[];
  className?: string;
}

/** History or activity of a record. */
export function Timeline({ label, items, className }: TimelineProps) {
  return (
    <ol aria-label={label} className={cn('flex flex-col', className)}>
      {items.map(({ id, title, time, dateTime, description, icon: Icon = Circle, tone = 'neutral' }, i) => (
        <li key={id} className="flex gap-3">
          <span aria-hidden className="flex flex-col items-center">
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border bg-surface', tones[tone])}>
              <Icon className="size-4" />
            </span>
            {i < items.length - 1 && <span className="w-px flex-1 bg-line" />}
          </span>
          <div className="min-w-0 flex-1 pt-1 pb-6 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="min-w-0 font-medium break-words">{title}</span>
              {time && (
                <time dateTime={dateTime} className="text-xs text-muted">
                  {time}
                </time>
              )}
            </div>
            {description && <div className="break-words text-muted">{description}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
