import { useRef, type Ref } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import {
  ControlFrame, FieldShell, innerInputClass, useField, type AdornmentProps, type BaseFieldProps,
  type ValueProps,
} from '../base';

/** `#` digit, `A` letter, `*` either. Anything else is fixed text. */
export const masks = {
  creditCard: '#### #### #### ####',
  cardExpiry: '##/##',
  cvc: '####',
  time: '##:##',
  ssn: '###-##-####',
  usZip: '#####',
  ipv4Part: '###',
} as const;

const tokens: Record<string, RegExp> = { '#': /\d/, A: /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ };

/** Keeps only the characters that fit the mask slots. */
export function unmask(text: string, mask: string) {
  const slots = [...mask].filter((c) => tokens[c]);
  let raw = '';
  for (const char of text) {
    const slot = slots[raw.length];
    if (!slot) break;
    if (tokens[slot]?.test(char)) raw += char;
  }
  return raw;
}

export function applyMask(raw: string, mask: string) {
  let out = '';
  let i = 0;
  for (const char of mask) {
    if (i >= raw.length) break;
    out += tokens[char] ? raw[i++] : char;
  }
  return out;
}

export interface MaskedInputProps
  extends BaseFieldProps,
    Omit<AdornmentProps, 'maxLength' | 'showCount'>,
    ValueProps<string> {
  mask: string;
  placeholder?: string;
  autoComplete?: string;
  uppercase?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** The value is the raw text without the mask, e.g. "4242424242424242". */
export function MaskedInput(props: MaskedInputProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    mask, value, defaultValue = '', onChange, onBlur, name, placeholder, autoComplete,
    uppercase, ref, leftIcon, rightIcon, prefix, suffix, clearable, onClear,
  } = rest;
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  const [raw, setRaw] = useControllableState({ value, defaultValue, onChange });
  const numeric = !/[A*]/.test(mask);

  return (
    <FieldShell shell={shell}>
      <ControlFrame
        state={state}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        prefix={prefix}
        suffix={suffix}
        className={controlClassName}
        success={!!shell.success && !state.invalid}
        onClear={
          clearable && raw
            ? () => {
                setRaw('');
                inputRef.current?.focus();
                onClear?.();
              }
            : undefined
        }
      >
        <input
          {...aria}
          ref={mergedRef}
          name={name}
          type="text"
          inputMode={numeric ? 'numeric' : 'text'}
          autoComplete={autoComplete ?? 'off'}
          placeholder={placeholder ?? mask.replace(/[#A*]/g, '0')}
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={applyMask(raw, mask)}
          onBlur={onBlur}
          onChange={(event) => {
            const input = event.target;
            const caret = input.selectionStart ?? input.value.length;
            const rawBefore = unmask(input.value.slice(0, caret), mask).length;
            const next = unmask(uppercase ? input.value.toUpperCase() : input.value, mask);
            setRaw(next);
            // Keep the caret where the person is typing, not at the end.
            requestAnimationFrame(() => {
              const at = applyMask(next.slice(0, rawBefore), mask).length;
              input.setSelectionRange(at, at);
            });
          }}
          className={innerInputClass}
        />
      </ControlFrame>
    </FieldShell>
  );
}
