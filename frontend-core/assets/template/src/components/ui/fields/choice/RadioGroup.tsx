import { useId, type Ref } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import {
  FieldShell, heightClass, minHeightClass, useField, type BaseFieldProps, type Option,
  type ValueProps,
} from '../base';
import { choiceBoxClass } from './Checkbox';

export interface RadioGroupProps<T extends string | number>
  extends BaseFieldProps,
    ValueProps<T | null> {
  options: Option<T>[];
  direction?: 'vertical' | 'horizontal';
  /** card: bordered tiles. segmented: joined buttons at field height. */
  variant?: 'default' | 'card' | 'segmented';
  ref?: Ref<HTMLInputElement>;
}

export function RadioGroup<T extends string | number>(props: RadioGroupProps<T>) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { options, direction = 'vertical', variant = 'default', ref } = rest;
  const autoName = useId();
  const [value, setValue] = useControllableState<T | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const locked = state.disabled || state.readOnly;
  const focusIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const segmented = variant === 'segmented';

  return (
    <FieldShell shell={shell} group="radiogroup">
      <div
        className={cn(
          segmented
            ? cn('flex w-full rounded-md border bg-surface p-0.5', heightClass[state.size],
                state.invalid ? 'border-danger' : 'border-control-line')
            : direction === 'horizontal'
              ? 'flex flex-wrap gap-x-6 gap-y-2'
              : 'flex flex-col',
          variant === 'card' && 'gap-2',
          controlClassName,
        )}
      >
        {options.map((option, i) => {
          const checked = option.value === value;
          const off = locked || option.disabled;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-2 text-sm',
                off ? 'cursor-not-allowed text-muted' : 'cursor-pointer',
                !segmented && minHeightClass[state.size],
                variant === 'card' && [
                  'min-w-48 flex-1 rounded-md border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                  checked ? 'border-primary bg-primary-subtle' : 'border-control-line bg-surface',
                ],
                segmented && [
                  'min-w-0 flex-1 justify-center rounded-md px-3 has-focus-visible:outline-2 has-focus-visible:outline-focus',
                  checked ? 'bg-primary text-on-primary' : !off && 'hover:bg-subtle',
                ],
              )}
            >
              <span className={cn('relative inline-flex', segmented && 'sr-only')}>
                <input
                  type="radio"
                  ref={i === focusIndex ? ref : undefined}
                  name={rest.name ?? autoName}
                  value={option.value}
                  checked={checked}
                  disabled={off}
                  onChange={() => setValue(option.value)}
                  onBlur={rest.onBlur}
                  className={cn(choiceBoxClass, 'rounded-full', state.invalid && 'border-danger')}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 m-auto hidden size-1.5 rounded-full bg-on-primary peer-checked:block"
                />
              </span>
              {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
              <span className={cn('min-w-0', segmented && 'truncate')}>
                {option.label}
                {option.description && !segmented && (
                  <span className="block text-xs text-muted">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </FieldShell>
  );
}
