import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * A callback that never changes but always runs the newest code. For passing
 * events to memoized rows. Call it in events or effects, not while rendering.
 */
export function useStableCallback<A extends unknown[], R>(callback: (...args: A) => R) {
  const latest = useRef(callback);
  useInsertionEffect(() => {
    latest.current = callback;
  });
  return useCallback((...args: A) => latest.current(...args), []);
}
