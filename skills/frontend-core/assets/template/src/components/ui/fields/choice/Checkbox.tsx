import { Check, Minus } from 'lucide-react';
import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import { cn } from '@/lib/cn';
import {
  FieldShell, focusRing, minHeightClass, useField, type BaseFieldProps, type Option,
  type ValueProps,
} from '../base';

export const choiceBoxClass = cn(
  'peer size-4 shrink-0 appearance-none border border-control-line bg-surface',
  'checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary',
  'disabled:cursor-not-allowed disabled:bg-subtle disabled:checked:border-muted disabled:checked:bg-muted',
  focusRing,
);

interface BoxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean | undefined;
  invalid?: boolean;
  disabled?: boolean | undefined;
  id?: string;
  name?: string | undefined;
  value?: string | number;
  onBlur?: (() => void) | undefined;
  ref?: Ref<HTMLInputElement> | undefined;
  'aria-label'?: string;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: boolean | undefined;
  'aria-required'?: boolean | undefined;
}

/** The box only. Also used in tables and lists. */
export function CheckboxBox(props: BoxProps) {
  const { indeterminate = false, invalid, ref, onChange, ...rest } = props;
  const boxRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(boxRef, ref);
  useEffect(() => {
    if (boxRef.current) boxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const Icon = indeterminate ? Minus : Check;
  return (
    <span className="relative inline-flex align-middle">
      <input
        {...rest}
        ref={mergedRef}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
        className={cn(choiceBoxClass, 'rounded-md', invalid && 'border-danger')}
      />
      <Icon
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-on-primary peer-checked:block peer-indeterminate:block"
      />
    </span>
  );
}

export interface CheckboxProps extends BaseFieldProps, ValueProps<boolean> {
  indeterminate?: boolean;
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** One yes/no checkbox. The label sits beside the box. */
export function Checkbox(props: CheckboxProps) {
  const { shell, aria, state, controlClassName, rest: own } = useField(props);
  const { ref, ...rest } = own;
  const [checked, setChecked] = useControllableState({
    value: rest.value,
    defaultValue: rest.defaultValue ?? false,
    onChange: rest.onChange,
  });
  return (
    <FieldShell shell={shell} inlineLabel>
      <div className={cn('flex items-center gap-2', minHeightClass[state.size], controlClassName)}>
        <CheckboxBox
          {...aria}
          ref={ref}
          name={rest.name}
          checked={checked}
          indeterminate={rest.indeterminate}
          invalid={state.invalid}
          disabled={state.disabled || state.readOnly}
          onChange={setChecked}
          onBlur={rest.onBlur}
        />
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
        </span>
      </div>
    </FieldShell>
  );
}

export interface CheckboxGroupProps<T extends string | number>
  extends BaseFieldProps,
    ValueProps<T[]> {
  options: Option<T>[];
  direction?: 'vertical' | 'horizontal';
  columns?: 1 | 2 | 3;
  selectAll?: boolean;
  max?: number;
  ref?: Ref<HTMLInputElement>;
}

const columnClass = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' };

export function CheckboxGroup<T extends string | number>(props: CheckboxGroupProps<T>) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { options, direction = 'vertical', columns = 1, selectAll, max, ref } = rest;
  const [values, setValues] = useControllableState<T[]>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? [],
    onChange: rest.onChange,
  });
  const locked = state.disabled || state.readOnly;
  const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
  const all = enabled.length > 0 && enabled.every((v) => values.includes(v));

  return (
    <FieldShell
      shell={shell}
      group="group"
      count={max === undefined ? undefined : { current: values.length, max }}
    >
      {selectAll && (
        <label className={cn('flex items-center gap-2 text-sm font-medium', minHeightClass[state.size])}>
          <CheckboxBox
            checked={all}
            indeterminate={!all && values.length > 0}
            disabled={locked}
            onChange={(on) =>
              setValues(
                on
                  ? [...new Set([...values, ...enabled])]
                  : values.filter((v) => !enabled.includes(v)),
              )
            }
          />
          {fieldText.selectAll}
        </label>
      )}
      <div
        className={cn(
          direction === 'horizontal' ? 'flex flex-wrap gap-x-6' : cn('grid', columnClass[columns]),
          controlClassName,
        )}
      >
        {options.map((option, i) => {
          const checked = values.includes(option.value);
          const full = max !== undefined && values.length >= max && !checked;
          return (
            <label
              key={option.value}
              className={cn('flex items-center gap-2 text-sm', minHeightClass[state.size])}
            >
              <CheckboxBox
                ref={i === 0 ? ref : undefined}
                name={rest.name}
                value={option.value}
                checked={checked}
                invalid={state.invalid}
                disabled={locked || option.disabled || full}
                onChange={(on) =>
                  setValues(on ? [...values, option.value] : values.filter((v) => v !== option.value))
                }
                onBlur={rest.onBlur}
              />
              <span className={cn('min-w-0', (locked || option.disabled) && 'text-muted')}>
                {option.label}
                {option.description && (
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
