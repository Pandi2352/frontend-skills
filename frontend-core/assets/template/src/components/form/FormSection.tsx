import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FormSectionProps {
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}

const grid = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

/** One column on phones. `items-start` keeps a row straight when one field has an error. */
export function FormSection({ title, description, columns = 1, children, className }: FormSectionProps) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={cn('flex flex-col gap-4', className)}>
      {title && (
        <div>
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      )}
      <div className={cn('grid items-start gap-4', grid[columns])}>{children}</div>
    </section>
  );
}
