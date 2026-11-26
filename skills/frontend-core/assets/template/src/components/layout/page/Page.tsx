import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { appConfig } from '@/config/app.config';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';

/** Uses the whole width next to the sidebar. `narrow` for forms and text. */
export function PageContainer({ children, className, narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn('flex w-full flex-col gap-6 p-4 md:p-6 xl:px-8', narrow && 'max-w-3xl', className)}>{children}</div>;
}

export interface Crumb {
  label: string;
  to?: string;
}

/** The middle collapses on phones. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label={uiText.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const middle = i > 0 && i < items.length - 2;
          return (
            <li key={`${item.label}-${item.to ?? ''}`} className={cn('flex min-w-0 items-center gap-1', middle && 'hidden sm:flex')}>
              {i > 0 && <span aria-hidden>/</span>}
              {item.to && !last ? (
                <Link to={item.to} className="truncate rounded-md hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="truncate">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  breadcrumb?: Crumb[];
  backTo?: string;
  /** Beside the title, e.g. a status badge. */
  badge?: ReactNode;
  actions?: ReactNode;
}

/** The page's only h1. Also sets the browser tab title. */
export function PageHeader({ title, description, breadcrumb, backTo, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <title>{`${title} · ${appConfig.name}`}</title>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {backTo && (
            <Link
              to={backTo}
              aria-label={uiText.back}
              className="inline-flex size-control-sm shrink-0 items-center justify-center rounded-md hover:bg-subtle focus-visible:outline-2 focus-visible:outline-focus"
            >
              <ArrowLeft aria-hidden className="size-4" />
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold break-words">{title}</h1>
              {badge}
            </div>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Search, filters and view options in one row of equal height. */
export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-end gap-2', className)}>{children}</div>;
}
