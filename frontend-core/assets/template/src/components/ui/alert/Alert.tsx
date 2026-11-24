import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { IconButton } from '../button';

const looks = {
  success: { icon: CircleCheck, box: 'border-success', tone: 'text-success' },
  error: { icon: CircleAlert, box: 'border-danger', tone: 'text-danger' },
  warning: { icon: TriangleAlert, box: 'border-warning', tone: 'text-warning' },
  info: { icon: Info, box: 'border-info', tone: 'text-info' },
};

export interface AlertProps {
  variant?: keyof typeof looks;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, action, onDismiss, className }: AlertProps) {
  const { icon: Icon, box, tone } = looks[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border bg-surface p-3 text-sm', box, className)}
    >
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', tone)} />
      <div className="min-w-0 flex-1">
        {title && <p className={cn('font-medium', tone)}>{title}</p>}
        {children}
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onDismiss && <IconButton icon={X} size="sm" className="-m-1" label={uiText.dismiss} onClick={onDismiss} />}
    </div>
  );
}
