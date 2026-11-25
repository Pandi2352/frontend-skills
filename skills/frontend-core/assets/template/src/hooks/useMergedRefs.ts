import { useCallback, type Ref } from 'react';

/** Gives one callback ref that fills both refs. */
export function useMergedRefs<T>(first: Ref<T> | undefined, second: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      for (const ref of [first, second]) {
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }
    },
    [first, second],
  );
}
