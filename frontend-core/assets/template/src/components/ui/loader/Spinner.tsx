import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Leave out when nearby text already says it is loading. */
  label?: string;
  className?: string;
}

const sizes = { xs: 'size-3', sm: 'size-4', md: 'size-6', lg: 'size-8' };

export function Spinner({ size = 'sm', label, className }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className={cn('inline-flex text-muted', className)}>
      <LoaderCircle aria-hidden className={cn('animate-spin', sizes[size])} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
