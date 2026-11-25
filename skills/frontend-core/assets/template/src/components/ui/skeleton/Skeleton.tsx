import type { ReactNode } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';

/** One gray block. Give it the size of the real content. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('h-4 animate-pulse rounded-md bg-line', className)} />;
}

/** Announces loading once for the whole group of blocks. */
function Busy({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <div role="status" aria-busy className={className}>
      <span className="sr-only">{uiText.loading}</span>
      {children}
    </div>
  );
}

const times = (n: number) => Array.from({ length: n }, (_, i) => i);

export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <Busy className={cn('flex flex-col gap-2', className)}>
      {times(lines).map((n) => (
        <Skeleton key={n} className={n === lines - 1 ? 'w-2/3' : ''} />
      ))}
    </Busy>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Busy className={cn('flex flex-col gap-3 rounded-md border border-line bg-surface p-4', className)}>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton />
      <Skeleton className="w-2/3" />
    </Busy>
  );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <Busy className={cn('flex flex-col gap-4', className)}>
      {times(fields).map((n) => (
        <div key={n} className="flex flex-col gap-1.5">
          <Skeleton className="w-28" />
          <Skeleton className="h-control" />
        </div>
      ))}
    </Busy>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Busy className="flex flex-col rounded-md border border-line bg-surface">
      {times(rows).map((r) => (
        <div key={r} className="flex min-h-control-lg items-center gap-4 border-b border-line px-4 last:border-b-0">
          {times(columns).map((c) => (
            <Skeleton key={c} className="flex-1" />
          ))}
        </div>
      ))}
    </Busy>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <TableSkeleton />
    </div>
  );
}
