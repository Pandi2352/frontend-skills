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

export interface TableState {
  page: number;
  pageSize: number;
  search: string;
  sort: { id: string; direction: 'asc' | 'desc' } | null;
}

export const defaultTableState: TableState = { page: 1, pageSize: 10, search: '', sort: null };
