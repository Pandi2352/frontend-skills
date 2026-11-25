import { CircleCheck, X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/loader';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import { frameButtonClass, frameClass } from './field.styles';
import type { FieldState } from './useField';

export function ClearButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={fieldText.clear}
      onClick={onClick}
      className={cn(frameButtonClass, className)}
    >
      <X aria-hidden className="size-4" />
    </button>
  );
}

interface ControlFrameProps {
  state: FieldState;
  children: ReactNode;
  leftIcon?: LucideIcon | undefined;
  rightIcon?: LucideIcon | undefined;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Field button on the far right: eye, calendar, stepper. */
  action?: ReactNode;
  onClear?: (() => void) | undefined;
  success?: boolean;
  grow?: boolean;
  className?: string | undefined;
  ref?: (node: HTMLDivElement | null) => void;
}

/** Border, icons, prefix/suffix, clear, spinner and action for every text box. */
export function ControlFrame(props: ControlFrameProps) {
  const {
    state, children, leftIcon: Left, rightIcon: Right, prefix, suffix, action,
    onClear, success, grow, className, ref,
  } = props;
  return (
    <div
      ref={ref}
      data-control
      className={frameClass(state, grow, className)}
      aria-busy={state.loading || undefined}
    >
      {prefix && (
        <span className="flex h-full shrink-0 items-center border-e border-line px-3 text-muted">
          {prefix}
        </span>
      )}
      {Left && <Left aria-hidden className="pointer-events-none ms-3 size-4 shrink-0 text-muted" />}
      {children}
      <span className="flex shrink-0 items-center gap-0.5 pe-1.5 empty:hidden">
        {onClear && !state.disabled && !state.readOnly && <ClearButton onClick={onClear} />}
        {state.loading && <Spinner className="p-1.5" label={fieldText.loading} />}
        {success && !state.loading && (
          <CircleCheck aria-hidden className="m-1.5 size-4 text-success" />
        )}
        {Right && <Right aria-hidden className="m-1.5 size-4 text-muted" />}
        {action}
      </span>
      {suffix && (
        <span className="flex h-full shrink-0 items-center border-s border-line px-3 text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Hidden inputs so value fields also work in a plain HTML form. */
export function HiddenInputs(props: {
  name: string | undefined;
  values: (string | number)[];
  disabled?: boolean;
}) {
  const { name, values, disabled } = props;
  if (!name) return null;
  return values.map((value) => (
    <input key={value} type="hidden" name={name} value={value} disabled={disabled} />
  ));
}
