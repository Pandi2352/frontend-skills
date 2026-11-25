import type { ReactNode, Ref } from 'react';
import { Spinner } from '@/components/ui/loader';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { FieldShell, focusRing, minHeightClass, useField, type BaseFieldProps, type ValueProps } from '../base';

export interface SwitchProps extends BaseFieldProps, ValueProps<boolean> {
  description?: ReactNode;
  /** Switch at the right end of the row, for settings lists. */
  spread?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** For settings that apply immediately. Use Checkbox for agreement. */
export function Switch(props: SwitchProps) {
  const { shell, aria, state, controlClassName, rest: own } = useField(props);
  const { ref, ...rest } = own;
  const [on, setOn] = useControllableState({
    value: rest.value,
    defaultValue: rest.defaultValue ?? false,
    onChange: rest.onChange,
  });
  return (
    <FieldShell shell={shell} inlineLabel>
      <div
        className={cn(
          'flex items-center gap-3',
          minHeightClass[state.size],
          rest.spread && 'flex-row-reverse justify-between',
          controlClassName,
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            {...aria}
            ref={ref}
            type="checkbox"
            role="switch"
            name={rest.name}
            checked={on}
            disabled={state.disabled || state.readOnly || state.loading}
            onChange={(event) => setOn(event.target.checked)}
            onBlur={rest.onBlur}
            className={cn(
              'peer h-6 w-11 appearance-none rounded-full bg-control-line transition-colors duration-150 checked:bg-primary',
              'disabled:cursor-not-allowed disabled:opacity-60',
              state.invalid && 'outline-2 outline-danger',
              focusRing,
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-0.5 start-0.5 flex size-5 items-center justify-center rounded-full bg-surface transition-transform duration-150 peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
          >
            {state.loading && <Spinner size="xs" />}
          </span>
        </span>
        <span className="min-w-0 text-sm">
          <label
            id={shell.ids.label}
            htmlFor={shell.ids.control}
            className={cn(state.disabled && 'text-muted', shell.hideLabel && 'sr-only')}
          >
            {shell.label}
            {shell.required && (
              <span aria-hidden className="text-danger">
                {' *'}
              </span>
            )}
          </label>
          {rest.description && <span className="block text-muted">{rest.description}</span>}
          {state.loading && <span className="sr-only">{fieldText.loading}</span>}
        </span>
      </div>
    </FieldShell>
  );
}
