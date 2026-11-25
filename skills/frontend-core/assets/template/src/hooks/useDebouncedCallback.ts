import { useCallback, useEffect, useRef } from 'react';

/** Runs `fn` once after `ms` without another call. Cancels on unmount. */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  const latest = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), ms);
    },
    [ms],
  );
}
