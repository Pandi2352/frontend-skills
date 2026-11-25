import { useState } from 'react';

/** One state for both controlled (`value`) and uncontrolled (`defaultValue`) use. */
export function useControllableState<T>(options: {
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}) {
  const [inner, setInner] = useState(options.defaultValue);
  const controlled = options.value !== undefined;
  const current = controlled ? (options.value as T) : inner;

  const set = (next: T) => {
    if (!controlled) setInner(next);
    options.onChange?.(next);
  };
  return [current, set] as const;
}
