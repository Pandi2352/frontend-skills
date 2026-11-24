import { ChevronLeft, ChevronRight } from 'lucide-react';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '../button';
import { Dropdown } from '../fields/select/Dropdown';

export interface PaginationProps {
  /** Starts at 1. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  className?: string;
}

/** 1 … 4 [5] 6 … 20 */
export function pageList(page: number, pages: number): (number | 'gap')[] {
  const near = [1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages);
  const list: (number | 'gap')[] = [];
  let last = 0;
  for (const n of [...new Set(near)]) {
    if (n - last === 2) list.push(last + 1);
    else if (n - last > 2) list.push('gap');
    list.push(n);
    last = n;
  }
  return list;
}

export function Pagination(props: PaginationProps) {
  const { page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [10, 25, 50, 100], className } = props;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', className)}>
      <span role="status" className="text-muted tabular-nums">
        {uiText.range(from, Math.min(current * pageSize, total), total)}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span aria-hidden className="hidden text-muted sm:inline">
              {uiText.rowsPerPage}
            </span>
            <Dropdown<number>
              hideLabel
              size="sm"
              label={uiText.rowsPerPage}
              className="w-20"
              options={pageSizes.map((n) => ({ value: n, label: String(n) }))}
              value={pageSize}
              onChange={(size) => size && onPageSizeChange(size)}
            />
          </div>
        )}
        <nav aria-label={uiText.pagination} className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} size="sm" label={uiText.previous} disabled={current <= 1} onClick={() => onPageChange(current - 1)} />
          {pageList(current, pages).map((n, i) =>
            n === 'gap' ? (
              <span key={`gap${i}`} aria-hidden className="px-1 text-muted">
                …
              </span>
            ) : (
              <Button
                key={n}
                size="sm"
                variant={n === current ? 'primary' : 'ghost'}
                aria-label={uiText.page(n)}
                aria-current={n === current ? 'page' : undefined}
                className={cn('min-w-control-sm px-2 tabular-nums', n !== current && 'hidden sm:inline-flex')}
                onClick={() => onPageChange(n)}
              >
                {n}
              </Button>
            ),
          )}
          <IconButton icon={ChevronRight} size="sm" label={uiText.next} disabled={current >= pages} onClick={() => onPageChange(current + 1)} />
        </nav>
      </div>
    </div>
  );
}
