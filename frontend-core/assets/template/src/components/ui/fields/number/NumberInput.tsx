import { Minus, Plus } from 'lucide-react';
import { useState, type Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import {
  ControlFrame, FieldShell, HiddenInputs, frameButtonClass, innerInputClass, useField,
  type AdornmentProps, type BaseFieldProps, type ValueProps,
} from '../base';

export function parseLocaleNumber(text: string, locale: string): number | null {
  const decimal =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.';
  const plain = [...text]
    .filter((c) => /[\d-]/.test(c) || c === decimal)
    .join('')
    .replace(decimal, '.');
  if (!/\d/.test(plain)) return null;
  const number = Number(plain);
  return Number.isFinite(number) ? number : null;
}

export interface NumberInputProps
  extends BaseFieldProps,
    Omit<AdornmentProps, 'maxLength' | 'showCount' | 'rightIcon'>,
    ValueProps<number | null> {
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places. 0 gives whole numbers. */
  precision?: number;
  grouping?: boolean;
  hideStepper?: boolean;
  align?: 'start' | 'end';
  locale?: string;
  placeholder?: string;
  ref?: Ref<HTMLInputElement>;
}

/** The value is a number, or null when empty (never 0 by accident). */
export function NumberInput(props: NumberInputProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    value, defaultValue = null, onChange, onBlur, min, max, step = 1, precision = 0,
    grouping = true, hideStepper, align = 'start', locale = appConfig.locale, placeholder, name,
    ref, leftIcon, prefix, suffix, clearable, onClear,
  } = rest;
  const [number, setNumber] = useControllableState<number | null>({ value, defaultValue, onChange });
  const [draft, setDraft] = useState<string | null>(null);
  const editable = !state.disabled && !state.readOnly;

  const format = (n: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: precision, useGrouping: grouping }).format(n);
  const fit = (n: number) => {
    const limited = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    return Number(limited.toFixed(precision));
  };
  const move = (amount: number) => {
    if (!editable) return;
    setDraft(null);
    setNumber(fit((number ?? (min !== undefined && min > 0 ? min - amount : 0)) + amount));
  };

  return (
    <FieldShell shell={shell}>
      <ControlFrame
        state={state}
        leftIcon={leftIcon}
        prefix={prefix}
        suffix={suffix}
        className={controlClassName}
        success={!!shell.success && !state.invalid}
        onClear={
          clearable && number !== null
            ? () => {
                setDraft(null);
                setNumber(null);
                onClear?.();
              }
            : undefined
        }
        action={
          !hideStepper && (
            <>
              <button
                type="button"
                tabIndex={-1}
                aria-label={fieldText.decrease}
                disabled={!editable || (min !== undefined && number !== null && number <= min)}
                onClick={() => move(-step)}
                className={frameButtonClass}
              >
                <Minus aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label={fieldText.increase}
                disabled={!editable || (max !== undefined && number !== null && number >= max)}
                onClick={() => move(step)}
                className={frameButtonClass}
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </>
          )
        }
      >
        <input
          {...aria}
          ref={ref}
          type="text"
          role="spinbutton"
          aria-valuenow={number ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          inputMode={precision > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          placeholder={placeholder}
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={draft ?? (number === null ? '' : format(number))}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            setNumber(parseLocaleNumber(text, locale));
          }}
          onKeyDown={(event) => {
            const amounts: Record<string, number> = {
              ArrowUp: event.shiftKey ? step * 10 : step,
              ArrowDown: event.shiftKey ? -step * 10 : -step,
              PageUp: step * 10,
              PageDown: -step * 10,
            };
            const amount = amounts[event.key];
            if (amount !== undefined) {
              event.preventDefault();
              move(amount);
            } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !/[\d.,\s-]/.test(event.key)) {
              event.preventDefault();
            }
          }}
          onBlur={() => {
            setDraft(null);
            if (number !== null && fit(number) !== number) setNumber(fit(number));
            onBlur?.();
          }}
          className={align === 'end' ? `${innerInputClass} text-end tabular-nums` : innerInputClass}
        />
      </ControlFrame>
      <HiddenInputs name={name} values={number === null ? [] : [number]} disabled={state.disabled} />
    </FieldShell>
  );
}
