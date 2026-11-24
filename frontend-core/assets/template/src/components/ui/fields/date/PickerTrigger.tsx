import type { LucideIcon } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import { ControlFrame, type FieldAria, type FieldState, type Popup } from '../base';

interface PickerTriggerProps {
  aria: FieldAria;
  state: FieldState;
  labelId: string;
  popup: Popup;
  icon?: LucideIcon;
  start?: ReactNode;
  text: string;
  placeholder: string;
  onToggle: () => void;
  onBlur?: (() => void) | undefined;
  onClear?: (() => void) | undefined;
  className?: string | undefined;
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}

/** Button that looks like a field and opens a popup (range, month, color). */
export function PickerTrigger(props: PickerTriggerProps) {
  const {
    aria, state, popup, text, labelId, icon, start, placeholder, onToggle, onBlur, onClear,
    className, triggerRef,
  } = props;
  const { open, context, setReference } = popup;
  return (
    <ControlFrame
      ref={setReference}
      state={state}
      rightIcon={icon}
      className={className}
      onClear={text ? onClear : undefined}
    >
      <button
        {...aria}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? context.floatingId : undefined}
        aria-readonly={state.readOnly || undefined}
        disabled={state.disabled}
        onClick={() => {
          if (!state.readOnly) onToggle();
        }}
        onBlur={() => {
          if (!open) onBlur?.();
        }}
        className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md px-3 text-start outline-none disabled:cursor-not-allowed"
      >
        {start}
        <span className={cn('truncate', !text && 'text-placeholder')}>{text || placeholder}</span>
      </button>
    </ControlFrame>
  );
}
