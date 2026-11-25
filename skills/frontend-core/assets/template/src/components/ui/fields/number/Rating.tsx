import { Star } from 'lucide-react';
import { useId, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { ClearButton, FieldShell, minHeightClass, useField, type BaseFieldProps, type ValueProps } from '../base';

export interface RatingProps extends BaseFieldProps, ValueProps<number | null> {
  max?: number;
  clearable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Rating(props: RatingProps) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { max = 5, clearable, ref, onBlur } = rest;
  const autoName = useId();
  const [value, setValue] = useControllableState<number | null>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? null,
    onChange: rest.onChange,
  });
  const locked = state.disabled || state.readOnly;
  return (
    <FieldShell shell={shell} group="radiogroup">
      <div className={cn('flex items-center gap-1', minHeightClass[state.size], controlClassName)}>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <label key={n} className={cn('relative p-1', !locked && 'cursor-pointer')}>
            <input
              type="radio"
              ref={n === (value ?? 1) ? ref : undefined}
              name={rest.name ?? autoName}
              value={n}
              checked={value === n}
              disabled={locked}
              onChange={() => setValue(n)}
              onBlur={onBlur}
              className="peer sr-only"
            />
            <span className="sr-only">{fieldText.stars(n)}</span>
            <Star
              aria-hidden
              className={cn(
                'size-6 rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                n <= (value ?? 0) ? 'fill-warning text-warning' : 'text-control-line',
                state.disabled && 'opacity-50',
              )}
            />
          </label>
        ))}
        {clearable && value !== null && !locked && <ClearButton onClick={() => setValue(null)} />}
      </div>
    </FieldShell>
  );
}
