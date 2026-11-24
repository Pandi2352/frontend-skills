import type { ReactElement } from 'react';
import {
  useController, type Control, type ControllerFieldState, type ControllerRenderProps,
  type FieldPath, type FieldValues, type RegisterOptions,
} from 'react-hook-form';

export type FieldBindings<V extends FieldValues, N extends FieldPath<V>> = ControllerRenderProps<V, N> & {
  error: string | undefined;
};

export interface FormFieldProps<V extends FieldValues, N extends FieldPath<V>> {
  control: Control<V>;
  name: N;
  rules?: Omit<RegisterOptions<V, N>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
  render: (field: FieldBindings<V, N>, state: ControllerFieldState) => ReactElement;
}

/** First message inside an error, also for arrays and objects. */
export function firstMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('message' in error && typeof error.message === 'string' && error.message) return error.message;
  for (const [key, inner] of Object.entries(error)) {
    if (key === 'ref') continue;
    const found = firstMessage(inner);
    if (found) return found;
  }
  return undefined;
}

/** Messages by key for object fields such as AddressFields. */
export function nestedMessages(error: unknown): Record<string, string | undefined> {
  if (!error || typeof error !== 'object') return {};
  return Object.fromEntries(Object.entries(error).map(([key, inner]) => [key, firstMessage(inner)]));
}

/**
 * Connects any field to React Hook Form: value, onChange, onBlur, ref, name and
 * error all arrive in `field`, so `{...field}` is enough.
 */
export function FormField<V extends FieldValues, N extends FieldPath<V>>(props: FormFieldProps<V, N>) {
  const { control, name, rules, render } = props;
  const { field, fieldState } = useController({ control, name, ...(rules ? { rules } : {}) });
  return render({ ...field, error: firstMessage(fieldState.error) }, fieldState);
}
