import { useEffect, useState } from 'react';

/** Shows a loader only after `delay`, then for at least `minimum`, so it never flickers. */
export function useDelayedLoading(isLoading: boolean, delay = 200, minimum = 300) {
  const [shownAt, setShownAt] = useState<number | null>(null);
  useEffect(() => {
    if (isLoading && shownAt === null) {
      const timer = setTimeout(() => setShownAt(Date.now()), delay);
      return () => clearTimeout(timer);
    }
    if (!isLoading && shownAt !== null) {
      const timer = setTimeout(() => setShownAt(null), Math.max(0, minimum - (Date.now() - shownAt)));
      return () => clearTimeout(timer);
    }
  }, [isLoading, shownAt, delay, minimum]);
  return shownAt !== null;
}
