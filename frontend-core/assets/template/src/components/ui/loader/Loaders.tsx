import { useEffect, useState, type ReactNode } from 'react';
import { uiText } from '@/constants/ui-text';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

function SlowNote({ after = 10_000 }: { after?: number }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), after);
    return () => clearTimeout(timer);
  }, [after]);
  return slow ? <p className="text-sm text-muted">{uiText.slow}</p> : null;
}

interface LoaderProps {
  label?: string;
  className?: string;
}

/** App start and session restore. */
export function PageLoader({ label = uiText.loading, className }: LoaderProps) {
  return (
    <div className={cn('flex min-h-dvh flex-col items-center justify-center gap-3', className)}>
      <Spinner size="lg" label={label} />
      <SlowNote />
    </div>
  );
}

/** One card or panel without a known layout. */
export function SectionLoader({ label = uiText.loading, className }: LoaderProps) {
  return (
    <div className={cn('flex min-h-40 flex-col items-center justify-center gap-3', className)}>
      <Spinner size="md" label={label} />
      <SlowNote />
    </div>
  );
}

interface LoadingOverlayProps extends LoaderProps {
  active: boolean;
  children: ReactNode;
}

/** Blocks a form or card while it saves. */
export function LoadingOverlay({ active, label = uiText.loading, children, className }: LoadingOverlayProps) {
  const shown = useDelayedLoading(active);
  return (
    <div className={cn('relative', className)} aria-busy={active || undefined}>
      <div inert={active}>{children}</div>
      {shown && (
        <div className="absolute inset-0 z-(--z-sticky) flex items-center justify-center rounded-md bg-surface/70">
          <Spinner size="md" label={label} />
        </div>
      )}
    </div>
  );
}

/** Thin bar at the top: page change or background refresh. */
export function TopProgressBar({ active, label = uiText.loading }: { active: boolean; label?: string }) {
  const shown = useDelayedLoading(active);
  if (!shown) return null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      className="fixed inset-x-0 top-0 z-(--z-toast) h-1 overflow-hidden bg-line"
    >
      <div className="h-full w-1/3 animate-indeterminate bg-primary" />
    </div>
  );
}

interface ProgressProps {
  label: string;
  /** 0 to 100. Leave out when unknown. */
  value?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  className?: string;
}

const bars = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' };

export function Progress({ label, value, variant = 'primary', showValue, className }: ProgressProps) {
  const percent = value === undefined ? undefined : Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className={className}>
      {showValue && (
        <div aria-hidden className="flex justify-between pb-1 text-sm">
          <span>{label}</span>
          {percent !== undefined && <span className="tabular-nums">{percent}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-md bg-line"
      >
        <div
          className={cn('h-full transition-[width] duration-150', bars[variant], percent === undefined && 'w-1/3 animate-indeterminate')}
          style={percent === undefined ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
