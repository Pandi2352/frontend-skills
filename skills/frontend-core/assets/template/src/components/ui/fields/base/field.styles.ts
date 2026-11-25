import { cn } from '@/lib/cn';
import type { ControlSize } from './field.types';

// The only place where control height, border, radius and states are defined.
export const heightClass: Record<ControlSize, string> = {
  sm: 'h-control-sm',
  md: 'h-control',
  lg: 'h-control-lg',
};
export const minHeightClass: Record<ControlSize, string> = {
  sm: 'min-h-control-sm',
  md: 'min-h-control',
  lg: 'min-h-control-lg',
};
export const squareClass: Record<ControlSize, string> = {
  sm: 'size-control-sm',
  md: 'size-control',
  lg: 'size-control-lg',
};

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export interface FrameState {
  size: ControlSize;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
}

/** The box around every control. `grow` lets chips wrap onto more lines. */
export const frameClass = (state: FrameState, grow = false, className?: string) =>
  cn(
    'relative flex w-full items-center rounded-md border bg-surface text-base text-foreground md:text-sm',
    'transition-colors duration-150',
    'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
    grow ? minHeightClass[state.size] : heightClass[state.size],
    state.invalid ? 'border-danger' : 'border-control-line',
    !state.disabled && !state.readOnly && !state.invalid && 'hover:border-foreground',
    (state.readOnly || state.disabled) && 'bg-subtle',
    state.disabled && 'cursor-not-allowed text-muted',
    className,
  );

/** The bare text box inside a frame. */
export const innerInputClass =
  'h-full min-w-0 flex-1 rounded-md bg-transparent px-3 outline-none placeholder:text-placeholder disabled:cursor-not-allowed';

export const popupClass =
  'z-(--z-popover) overflow-auto rounded-md border border-control-line bg-surface text-sm text-foreground outline-none';

/** Small icon button inside a frame (clear, eye, calendar, stepper). */
export const frameButtonClass = cn(
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground',
  'disabled:cursor-not-allowed disabled:opacity-50',
  focusRing,
);
