import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from '../loader';

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-secondary text-on-secondary hover:bg-secondary-hover',
  outline: 'border border-control-line bg-surface text-foreground hover:bg-subtle',
  ghost: 'text-foreground hover:bg-subtle',
  danger: 'bg-danger text-on-danger hover:bg-danger-hover',
  link: 'text-primary underline-offset-4 hover:underline',
};
const sizes = {
  sm: 'h-control-sm px-3 text-sm',
  md: 'h-control px-4 text-sm',
  lg: 'h-control-lg px-5 text-base',
};
const squares = { sm: 'size-control-sm px-0', md: 'size-control px-0', lg: 'size-control-lg px-0' };

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary', size = 'md', isLoading = false, fullWidth, leftIcon: Left,
    rightIcon: Right, className, children, type = 'button', onClick, ...rest
  } = props;
  return (
    <button
      type={type}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      onClick={(event) => {
        // Stays focusable while loading, but cannot be pressed again.
        if (isLoading) event.preventDefault();
        else onClick?.(event);
      }}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-2', isLoading && 'opacity-0')}>
        {Left && <Left aria-hidden className="size-4" />}
        {children}
        {Right && <Right aria-hidden className="size-4" />}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className="text-current" />
        </span>
      )}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: LucideIcon;
  /** Accessible name. Required because there is no visible text. */
  label: string;
}

export function IconButton({ icon: Icon, label, className, size = 'md', ...rest }: IconButtonProps) {
  return (
    <Button
      variant="ghost"
      aria-label={label}
      size={size}
      className={cn(squares[size], className)}
      {...rest}
    >
      <Icon aria-hidden className="size-4" />
    </Button>
  );
}
