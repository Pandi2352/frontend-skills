import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { Skeleton } from '../skeleton';

export interface StatCardProps {
  label: string;
  /** Already formatted. */
  value: ReactNode;
  icon?: LucideIcon;
  /** Against the last period: 0.12 is +12%. */
  change?: number;
  /** What the change is against, e.g. "than last month". */
  changeNote?: string;
  /** Costs and errors: a fall is good. */
  lowerIsBetter?: boolean;
  isLoading?: boolean;
  /** Below the numbers, e.g. a small chart. */
  children?: ReactNode;
  className?: string;
}

export function StatCard(props: StatCardProps) {
  const { label, value, icon: Icon, change, changeNote, lowerIsBetter, isLoading, children, className } = props;
  const direction = change === undefined || change === 0 ? 'same' : change > 0 ? 'up' : 'down';
  const good = direction === 'same' ? undefined : (direction === 'up') !== !!lowerIsBetter;
  const Arrow = { same: Minus, up: TrendingUp, down: TrendingDown }[direction];
  const words = { same: uiText.unchanged, up: uiText.increased, down: uiText.decreased }[direction];
  return (
    <div aria-busy={isLoading || undefined} className={cn('flex min-w-0 flex-col gap-1 rounded-md border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span className="min-w-0 break-words">{label}</span>
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="w-36" />
        </>
      ) : (
        <>
          <span className="text-2xl font-semibold break-words">{value}</span>
          {change !== undefined && (
            <span className="flex flex-wrap items-center gap-1 text-sm">
              <span className={cn('inline-flex items-center gap-1 font-medium', good === true && 'text-success', good === false && 'text-danger')}>
                <Arrow aria-hidden className="size-4" />
                <span className="sr-only">{words} </span>
                {direction !== 'same' && `${Math.abs(Math.round(change * 1000) / 10)}%`}
              </span>
              {changeNote && <span className="text-muted">{changeNote}</span>}
            </span>
          )}
        </>
      )}
      {children}
    </div>
  );
}
