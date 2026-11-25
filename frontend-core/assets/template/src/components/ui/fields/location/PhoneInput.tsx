import { lazy, Suspense, useEffect, useId, useRef, type Ref, type RefObject } from 'react';
import { fieldText } from '@/constants/field-text';
import { retryImport } from '@/lib/lazy';
import {
  ControlFrame, FieldShell, HiddenInputs, innerInputClass, useField, type BaseFieldProps, type ValueProps,
} from '../base';

export interface PhoneInputProps extends BaseFieldProps, ValueProps<string> {
  defaultCountry?: string;
  onlyCountries?: string[];
  preferredCountries?: string[];
  placeholder?: string;
  clearable?: boolean;
  onCountryChange?: (country: string) => void;
  ref?: Ref<HTMLInputElement>;
}

// Phone data is large, so pages do not wait for it.
const PhoneControl = lazy(() =>
  retryImport(() => import('./PhoneControl')).then((m) => ({ default: m.PhoneControl })),
);

/** Validation rule: `rules={{ validate: phoneRule() }}`. Accepts an empty value; add `required`. */
export const phoneRule =
  (message: string = fieldText.invalidPhone) =>
  async (value: string | null | undefined): Promise<true | string> => {
    if (!value) return true;
    const { isValidPhone } = await retryImport(() => import('@/lib/phone'));
    return isValidPhone(value) || message;
  };

/** Same label, height and value until the real control is ready. */
function PhonePlaceholder({ focusedRef, ...props }: PhoneInputProps & { focusedRef: RefObject<boolean> }) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const { name, ref, value: held, defaultValue } = rest;
  const value = held ?? defaultValue ?? '';
  return (
    <FieldShell shell={shell}>
      <ControlFrame state={state} className={controlClassName}>
        <input
          {...aria}
          ref={ref}
          type="tel"
          aria-busy
          readOnly
          disabled={state.disabled}
          value={value}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          className={innerInputClass}
        />
      </ControlFrame>
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
    </FieldShell>
  );
}

/** Keeps the focus when the real control takes over. */
function KeepFocus({ id, focusedRef }: { id: string; focusedRef: RefObject<boolean> }) {
  useEffect(() => {
    if (focusedRef.current) document.getElementById(id)?.focus();
  }, [id, focusedRef]);
  return null;
}

/** Value: E.164, e.g. "+919876543210", or "" when empty. */
export function PhoneInput(props: PhoneInputProps) {
  const autoId = useId();
  const focusedRef = useRef(false);
  const id = props.id ?? autoId;
  return (
    <Suspense fallback={<PhonePlaceholder {...props} id={id} focusedRef={focusedRef} />}>
      <PhoneControl {...props} id={id} />
      <KeepFocus id={id} focusedRef={focusedRef} />
    </Suspense>
  );
}
