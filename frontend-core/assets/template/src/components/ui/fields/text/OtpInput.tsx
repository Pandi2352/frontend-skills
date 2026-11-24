import { useState, type Ref } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import { FieldShell, squareClass, useField, type BaseFieldProps, type ValueProps } from '../base';

export interface OtpInputProps extends BaseFieldProps, ValueProps<string> {
  length?: number;
  alphanumeric?: boolean;
  /** Hides the characters. */
  mask?: boolean;
  onComplete?: (code: string) => void;
  ref?: Ref<HTMLInputElement>;
}

/** One real input under the boxes, so paste, autofill and screen readers work. */
export function OtpInput(props: OtpInputProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    length = 6, alphanumeric, mask, value, defaultValue = '', onChange, onBlur, onComplete,
    name, ref,
  } = rest;
  const [code, setCode] = useControllableState({ value, defaultValue, onChange });
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell shell={shell}>
      <div className={cn('relative flex w-fit max-w-full gap-2', controlClassName)}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(code.length, length - 1);
          return (
            <span
              // scan-ok: the boxes never move
              key={i}
              aria-hidden
              className={cn(
                'flex min-w-0 items-center justify-center rounded-md border bg-surface font-medium',
                squareClass[state.size],
                state.invalid ? 'border-danger' : 'border-control-line',
                (state.disabled || state.readOnly) && 'bg-subtle text-muted',
                active && 'outline-2 outline-offset-2 outline-focus',
              )}
            >
              {code[i] && mask ? '•' : code[i]}
            </span>
          );
        })}
        <input
          {...aria}
          ref={ref}
          name={name}
          type="text"
          inputMode={alphanumeric ? 'text' : 'numeric'}
          autoComplete="one-time-code"
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={code}
          onFocus={(event) => {
            setFocused(true);
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChange={(event) => {
            const pattern = alphanumeric ? /[^a-zA-Z0-9]/g : /\D/g;
            const next = event.target.value.replace(pattern, '').slice(0, length);
            setCode(next);
            if (next.length === length && next !== code) onComplete?.(next);
          }}
          className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    </FieldShell>
  );
}
