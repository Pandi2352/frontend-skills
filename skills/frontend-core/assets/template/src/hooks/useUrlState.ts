import { useSearchParams } from 'react-router';

/**
 * One value kept in the address, so links, reload and Back work. For tabs,
 * filters and open panels. Pass `allowed` to ignore anything else. `clear` removes
 * others with it: a new filter starts at the first page, `['page']`.
 */
export function useUrlState<T extends string>(key: string, initial: T, allowed?: readonly T[], clear: string[] = []) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key) as T | null;
  const value = raw !== null && (!allowed || allowed.includes(raw)) ? raw : initial;
  const set = (next: T) =>
    setParams(
      (old) => {
        const result = new URLSearchParams(old);
        if (next === initial) result.delete(key);
        else result.set(key, next);
        clear.forEach((k) => result.delete(k));
        return result;
      },
      { replace: true, preventScrollReset: true },
    );
  return [value, set] as const;
}
