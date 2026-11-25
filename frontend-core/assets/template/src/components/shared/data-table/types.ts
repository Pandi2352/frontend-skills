import type { ReactNode } from 'react';

export interface Column<T> {
  id: string;
  header: string;
  /** Plain value, used for sorting, search and export. */
  value?: (row: T) => string | number | boolean | Date | null | undefined;
  /** What is shown. Default: the value. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Any class, e.g. "w-40". */
  className?: string;
  /** false: always visible. */
  hideable?: boolean;
  defaultHidden?: boolean;
}

export const alignClass = { start: 'text-start', center: 'text-center', end: 'text-end' };

export function showCell<T>(column: Column<T>, row: T): ReactNode {
  if (column.cell) return column.cell(row);
  const value = column.value?.(row);
  if (value === null || value === undefined || value === '') return '—';
  return value instanceof Date ? value.toLocaleDateString() : String(value);
}

export interface TableState {
  page: number;
  pageSize: number;
  search: string;
  sort: { id: string; direction: 'asc' | 'desc' } | null;
}

export const defaultTableState: TableState = { page: 1, pageSize: 10, search: '', sort: null };
