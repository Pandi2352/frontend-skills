import type { ReactNode } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { CopyButton } from '../copy-button';
import { Skeleton } from '../skeleton';

export interface KeyValue {
  label: string;
  /** Nothing shows a dash. */
  value: ReactNode;
  /** Adds a copy button for this text. */
  copy?: string;
  /** Uses the whole row. */
  wide?: boolean;
}

export interface KeyValueListProps {
  items: KeyValue[];
  columns?: 1 | 2 | 3;
  /** Label beside the value instead of above it. */
  layout?: 'stacked' | 'row';
  isLoading?: boolean;
  className?: string;
}

const grids = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' };

/** Details of one record. */
export function KeyValueList({ items, columns = 2, layout = 'stacked', isLoading, className }: KeyValueListProps) {
  return (
    <dl aria-busy={isLoading || undefined} className={cn('grid gap-x-6 gap-y-4 text-sm', grids[columns], className)}>
      {items.map(({ label, value, copy, wide }) => (
        <div
          key={label}
          className={cn('min-w-0', layout === 'row' && 'flex items-baseline justify-between gap-4', wide && 'col-span-full')}
        >
          <dt className="text-muted">{label}</dt>
          <dd className={cn('flex min-w-0 items-center gap-1 break-words', layout === 'row' && 'text-end')}>
            {isLoading ? (
              <Skeleton className="w-32" />
            ) : (
              <>
                <span className="min-w-0 break-words">
                  {value === null || value === undefined || value === '' ? '—' : value}
                </span>
                {copy && <CopyButton iconOnly size="sm" text={copy} label={uiText.copyItem(label)} />}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
