import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons or a menu beside the title. */
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** Heading level of the title, to fit the page. */
  level?: 2 | 3 | 4;
  /** No space around the content, for tables and lists. */
  flush?: boolean;
  className?: string;
}

const headings = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Card(props: CardProps) {
  const { title, description, actions, footer, children, level = 2, flush, className } = props;
  const Heading = headings[level];
  return (
    <div className={cn('flex min-w-0 flex-col rounded-md border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className={cn('flex flex-wrap items-start justify-between gap-2 p-4', !flush && 'pb-0')}>
          <div className="min-w-0">
            {title && <Heading className="font-semibold break-words">{title}</Heading>}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children !== undefined && <div className={cn('min-w-0 flex-1', !flush && 'p-4')}>{children}</div>}
      {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-4">{footer}</div>}
    </div>
  );
}
