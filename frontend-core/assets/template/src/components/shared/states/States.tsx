import { CircleAlert, Inbox, SearchX, WifiOff, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SectionLoader } from '@/components/ui/loader';
import { uiText } from '@/constants/ui-text';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** There is no data yet. */
export function EmptyState(props: EmptyStateProps) {
  const { icon: Icon = Inbox, title = uiText.emptyTitle, description, action, className } = props;
  return (
    <div className={cn('flex flex-col items-center gap-2 p-8 text-center', className)}>
      <Icon aria-hidden className="size-8 text-muted" />
      <p className="font-medium">{title}</p>
      {description && <div className="max-w-md text-sm text-muted">{description}</div>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/** There is data, but the search or filter hides all of it. */
export function NoResults({ onClear }: { onClear?: (() => void) | undefined }) {
  return (
    <EmptyState
      icon={SearchX}
      title={uiText.noResultsTitle}
      description={uiText.noResultsMessage}
      action={onClear && <Button variant="outline" onClick={onClear}>{uiText.clearAll}</Button>}
    />
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: ReactNode;
  onRetry?: (() => void) | undefined;
  /** Request id for support. */
  reference?: string | undefined;
  className?: string;
}

export function ErrorState(props: ErrorStateProps) {
  const { title = uiText.errorTitle, message = uiText.errorMessage, onRetry, reference, className } = props;
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 p-8 text-center', className)}>
      <CircleAlert aria-hidden className="size-8 text-danger" />
      <p className="font-medium">{title}</p>
      <div className="max-w-md text-sm text-muted">{message}</div>
      {reference && (
        <p className="text-xs text-muted">
          {uiText.reference}: {reference}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          {uiText.retry}
        </Button>
      )}
    </div>
  );
}

export interface AsyncViewProps<T> {
  data: T | undefined;
  isLoading: boolean;
  /** Message to show, or anything else that is truthy. */
  error?: unknown;
  onRetry?: () => void;
  isEmpty?: (data: T) => boolean;
  loader?: ReactNode;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Chooses loading, error, empty or content. Keeps old content if a refresh fails. */
export function AsyncView<T>(props: AsyncViewProps<T>) {
  const { data, isLoading, error, onRetry, isEmpty, loader = <SectionLoader />, empty = <EmptyState />, children } = props;
  const showLoader = useDelayedLoading(isLoading && data === undefined);
  if (data !== undefined) return isEmpty?.(data) ? empty : children(data);
  if (error) return <ErrorState {...(typeof error === 'string' ? { message: error } : {})} onRetry={onRetry} />;
  return showLoader ? loader : null;
}

export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <div role="status">
      {!online && (
        <p className="flex items-center justify-center gap-2 border-b border-warning bg-surface p-2 text-sm text-warning">
          <WifiOff aria-hidden className="size-4" />
          {uiText.offline}
        </p>
      )}
    </div>
  );
}
