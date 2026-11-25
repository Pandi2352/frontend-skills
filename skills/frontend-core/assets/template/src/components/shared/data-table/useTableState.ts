import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { defaultTableState, type TableState } from './types';

const whole = (text: string | null, fallback: number, max: number) => {
  const n = Number(text);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
};

/** Keeps page, size, search and sort in the URL, so links and Back work. */
export function useTableState(defaults: Partial<TableState> = {}) {
  const [params, setParams] = useSearchParams();
  const { page, pageSize, search, sort } = { ...defaultTableState, ...defaults };
  const start = useMemo<TableState>(
    () => ({ page, pageSize, search, sort }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sort is compared by its content
    [page, pageSize, search, sort?.id, sort?.direction],
  );

  const state = useMemo<TableState>(() => {
    const [id, direction] = (params.get('sort') ?? '').split(':');
    return {
      page: whole(params.get('page'), start.page, 1_000_000),
      pageSize: whole(params.get('size'), start.pageSize, 500),
      search: params.get('q') ?? start.search,
      sort: id ? { id, direction: direction === 'desc' ? 'desc' : 'asc' } : start.sort,
    };
  }, [params, start]);

  const setState = useCallback(
    (next: TableState) =>
      setParams(
        (old) => {
          const result = new URLSearchParams(old);
          const put = (key: string, value: string, fallback: string) =>
            value === fallback ? result.delete(key) : result.set(key, value);
          put('page', String(next.page), String(start.page));
          put('size', String(next.pageSize), String(start.pageSize));
          put('q', next.search, start.search);
          put('sort', next.sort ? `${next.sort.id}:${next.sort.direction}` : '', start.sort ? `${start.sort.id}:${start.sort.direction}` : '');
          return result;
        },
        // Typing a search should not fill the history.
        { replace: next.page === state.page },
      ),
    [setParams, start, state.page],
  );
  return [state, setState] as const;
}
