import { appConfig } from '@/config/app.config';
import type { Column, TableState } from './types';

const isEmpty = (v: unknown) => v === null || v === undefined || v === '';

/** Search and sort in the browser. Empty values always come last. */
export function processRows<T>(rows: readonly T[], columns: Column<T>[], state: Pick<TableState, 'search' | 'sort'>): T[] {
  const words = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searched = columns.filter((c) => c.value && c.searchable !== false);
  const found = words.length
    ? rows.filter((row) => {
        const text = searched.map((c) => String(c.value?.(row) ?? '')).join(' ').toLowerCase();
        return words.every((w) => text.includes(w));
      })
    : [...rows];

  const column = columns.find((c) => c.id === state.sort?.id);
  const { value } = column ?? {};
  if (!value || !state.sort) return found;
  const sign = state.sort.direction === 'asc' ? 1 : -1;
  const compareText = new Intl.Collator(appConfig.locale, { numeric: true, sensitivity: 'base' }).compare;
  return found
    .map((row) => ({ row, v: value(row) }))
    .sort((a, b) => {
      if (isEmpty(a.v) || isEmpty(b.v)) return Number(isEmpty(a.v)) - Number(isEmpty(b.v));
      const result =
        typeof a.v === 'string' || typeof b.v === 'string'
          ? compareText(String(a.v), String(b.v))
          : Number(a.v) - Number(b.v);
      return result * sign;
    })
    .map(({ row }) => row);
}
