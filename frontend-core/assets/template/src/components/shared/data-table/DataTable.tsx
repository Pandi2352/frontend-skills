import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronsUpDown, Columns3, Download } from 'lucide-react';
import { Fragment, useId, useState, type ReactNode } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { DropdownMenu, type MenuItem } from '@/components/ui/dropdown-menu';
import { CheckboxBox } from '@/components/ui/fields/choice/Checkbox';
import { SearchInput } from '@/components/ui/fields/text/SearchInput';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { uiText } from '@/constants/ui-text';
import { useControllableState } from '@/hooks/useControllableState';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { cn } from '@/lib/cn';
import { downloadText, toCsv } from '@/utils/csv';
import { EmptyState, ErrorState, NoResults } from '../states';
import { processRows } from './process';
import { RowActions } from './RowActions';
import { defaultTableState, type Column, type TableState } from './types';

export interface DataTableProps<T> {
  /** Read by screen readers. */
  caption: string;
  columns: Column<T>[];
  data: readonly T[] | undefined;
  getRowId: (row: T) => string;
  /** Names a row in "Select …" and "Actions for …". */
  getRowName: (row: T) => string;

  /** client: searches, sorts and pages here. server: your API does it. */
  mode?: 'client' | 'server';
  /** All rows on the server. */
  total?: number;
  state?: TableState;
  onStateChange?: (state: TableState) => void;

  isLoading?: boolean;
  /** Background refresh; old rows stay. */
  isFetching?: boolean;
  error?: string | undefined;
  onRetry?: () => void;
  empty?: ReactNode;

  searchable?: boolean;
  searchPlaceholder?: string;
  /** Filters or buttons beside the search. */
  toolbar?: ReactNode;
  /** true when outside filters may hide rows. */
  isFiltered?: boolean;
  onClearFilters?: () => void;
  columnPicker?: boolean;
  /** File name without extension. Exports the rows found, all columns shown. */
  exportName?: string;

  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  bulkActions?: (ids: string[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => MenuItem[];
  renderDetails?: (row: T) => ReactNode;

  pageSizes?: number[];
  hidePagination?: boolean;
  /** On phones: scroll sideways, or one card per row. */
  mobile?: 'scroll' | 'cards';
  /** Needs a height, e.g. "max-h-96". The header stays visible. */
  scrollClassName?: string;
  className?: string;
}

const alignClass = { start: 'text-start', center: 'text-center', end: 'text-end' };

function show<T>(column: Column<T>, row: T): ReactNode {
  if (column.cell) return column.cell(row);
  const value = column.value?.(row);
  if (value === null || value === undefined || value === '') return '—';
  return value instanceof Date ? value.toLocaleDateString() : String(value);
}

/** The search box text. Follows outside changes (Back, Clear) but never fights typing. */
function useSearchText(current: string) {
  const [text, type] = useState(current);
  const [seen, setSeen] = useState(current);
  const [lastSent, sent] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current !== lastSent) {
      type(current);
      sent(current);
    }
  }
  return { text, type, sent };
}

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    caption, columns, data, getRowId, getRowName, mode = 'client', isLoading = false, isFetching = false,
    error, onRetry, empty = <EmptyState />, searchable = true, searchPlaceholder, toolbar, isFiltered = false,
    onClearFilters, columnPicker = true, exportName, selectable, bulkActions, rowActions, renderDetails,
    pageSizes, hidePagination, mobile = 'scroll', scrollClassName, className,
  } = props;

  const detailsId = useId();
  const [state, setState] = useControllableState<TableState>({
    value: props.state, defaultValue: defaultTableState, onChange: props.onStateChange,
  });
  const [selected, setSelected] = useControllableState<string[]>({
    value: props.selected, defaultValue: [], onChange: props.onSelectedChange,
  });
  const search = useSearchText(state.search);
  const [hidden, setHidden] = useState(() => columns.filter((c) => c.defaultHidden).map((c) => c.id));
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const showSkeleton = useDelayedLoading(isLoading && !data);

  const visible = columns.filter((c) => !hidden.includes(c.id));
  const found = mode === 'client' ? processRows(data ?? [], columns, state) : [...(data ?? [])];
  const total = mode === 'client' ? found.length : (props.total ?? found.length);
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  // A deletion can leave the current page empty.
  const page = Math.min(state.page, pages);
  const rows =
    mode === 'client' && !hidePagination ? found.slice((page - 1) * state.pageSize, page * state.pageSize) : found;

  const pageIds = rows.map(getRowId);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));
  const selectPage = (on: boolean) =>
    setSelected(on ? [...new Set([...selected, ...pageIds])] : selected.filter((id) => !pageIds.includes(id)));
  const selectRow = (id: string, on: boolean) =>
    setSelected(on ? [...selected, id] : selected.filter((s) => s !== id));
  const clear = () => setSelected([]);

  const sortBy = (id: string) => {
    const now = state.sort?.id === id ? state.sort.direction : null;
    setState({
      ...state,
      page: 1,
      sort: now === null ? { id, direction: 'asc' } : now === 'asc' ? { id, direction: 'desc' } : null,
    });
  };
  const clearAll = () => {
    search.type('');
    setState({ ...state, page: 1, search: '' });
    onClearFilters?.();
  };
  const exportRows = () => {
    const out = visible.filter((c) => c.value);
    downloadText(
      `${exportName}.csv`,
      toCsv([out.map((c) => c.header), ...found.map((row) => out.map((c) => c.value?.(row)))]),
    );
  };

  const cellPad = compact ? 'px-3 py-1' : 'px-3 py-2.5';
  const extra = Number(!!selectable) + Number(!!rowActions) + Number(!!renderDetails);

  let body: ReactNode;
  if (error && !data) body = <ErrorState message={error} onRetry={onRetry} />;
  else if (!data) body = showSkeleton || !isLoading ? <TableSkeleton columns={Math.max(2, visible.length)} /> : <div className="min-h-40" />;
  else if (rows.length === 0) body = state.search || isFiltered ? <NoResults onClear={clearAll} /> : empty;
  else {
    body = (
      <>
        {mobile === 'cards' && (
          <ul className="divide-y divide-line md:hidden">
            {rows.map((row) => {
              const id = getRowId(row);
              const [first, ...others] = visible;
              return (
                <li key={id} className="flex gap-3 p-3 text-sm">
                  {selectable && (
                    <CheckboxBox aria-label={uiText.selectRow(getRowName(row))} checked={selected.includes(id)} onChange={(on) => selectRow(id, on)} />
                  )}
                  <div className="min-w-0 flex-1">
                    {first && <div className="font-medium">{show(first, row)}</div>}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-1">
                      {others.map((c) => (
                        <Fragment key={c.id}>
                          <dt className="text-muted">{c.header}</dt>
                          <dd className="min-w-0 break-words">{show(c, row)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                    {renderDetails && expanded.includes(id) && <div className="pt-2">{renderDetails(row)}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col">
                    {rowActions && <RowActions name={getRowName(row)} items={rowActions(row)} />}
                    {renderDetails && (
                      <IconButton
                        icon={expanded.includes(id) ? ChevronDown : ChevronRight}
                        size="sm"
                        label={uiText.expandRow(getRowName(row))}
                        aria-expanded={expanded.includes(id)}
                        onClick={() => setExpanded(expanded.includes(id) ? expanded.filter((e) => e !== id) : [...expanded, id])}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {/* Focusable, so it can be scrolled with the keyboard. */}
        <div
          role="region"
          aria-label={caption}
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- scroll areas must be reachable by keyboard
          tabIndex={0}
          className={cn(
            'overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
            mobile === 'cards' && 'hidden md:block',
            scrollClassName,
          )}
        >
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 z-(--z-sticky) bg-subtle">
              <tr>
                {renderDetails && <th className="w-10" aria-hidden />}
                {selectable && (
                  <th scope="col" className={cn('w-10', cellPad)}>
                    <CheckboxBox aria-label={uiText.selectPage} checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={selectPage} />
                  </th>
                )}
                {visible.map((c) => {
                  const direction = state.sort?.id === c.id ? state.sort.direction : null;
                  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown;
                  return (
                    <th
                      key={c.id}
                      scope="col"
                      aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={cn('font-medium whitespace-nowrap', cellPad, alignClass[c.align ?? 'start'], c.className)}
                    >
                      {c.sortable ? (
                        <Button variant="ghost" size="sm" rightIcon={Icon} className="-mx-2 px-2" onClick={() => sortBy(c.id)}>
                          {c.header}
                        </Button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
                {rowActions && (
                  <th scope="col" className="w-12">
                    <span className="sr-only">{uiText.actions}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = getRowId(row);
                const isOpen = expanded.includes(id);
                const isSelected = selected.includes(id);
                return (
                  <Fragment key={id}>
                    <tr className={cn('border-t border-line', isSelected ? 'bg-primary-subtle' : 'hover:bg-subtle')}>
                      {renderDetails && (
                        <td className="px-1">
                          <IconButton
                            icon={isOpen ? ChevronDown : ChevronRight}
                            size="sm"
                            label={uiText.expandRow(getRowName(row))}
                            aria-expanded={isOpen}
                            aria-controls={isOpen ? `${detailsId}-${id}` : undefined}
                            onClick={() => setExpanded(isOpen ? expanded.filter((e) => e !== id) : [...expanded, id])}
                          />
                        </td>
                      )}
                      {selectable && (
                        <td className={cellPad}>
                          <CheckboxBox aria-label={uiText.selectRow(getRowName(row))} checked={isSelected} onChange={(on) => selectRow(id, on)} />
                        </td>
                      )}
                      {visible.map((c) => (
                        <td key={c.id} className={cn(cellPad, alignClass[c.align ?? 'start'], c.align === 'end' && 'tabular-nums', c.className)}>
                          {show(c, row)}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="px-2 text-end">
                          <RowActions name={getRowName(row)} items={rowActions(row)} />
                        </td>
                      )}
                    </tr>
                    {renderDetails && isOpen && (
                      <tr id={`${detailsId}-${id}`} className="border-t border-line bg-subtle">
                        <td colSpan={visible.length + extra} className="p-4">
                          {renderDetails(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  const menu: MenuItem[] = [
    { kind: 'label', label: uiText.columns },
    ...columns
      .filter((c) => c.hideable !== false)
      .map((c) => ({
        label: c.header,
        checked: !hidden.includes(c.id),
        onSelect: () => setHidden(hidden.includes(c.id) ? hidden.filter((h) => h !== c.id) : [...hidden, c.id]),
      })),
    { kind: 'separator' },
    { label: uiText.density, checked: compact, onSelect: () => setCompact(!compact) },
  ];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {(searchable || toolbar || columnPicker || exportName) && (
        <div className="flex flex-wrap items-end gap-2">
          {searchable && (
            <SearchInput
              hideLabel
              label={uiText.search}
              placeholder={searchPlaceholder ?? uiText.search}
              className="w-full sm:w-64"
              value={search.text}
              onChange={(event) => search.type(event.target.value)}
              onSearch={(text) => {
                search.sent(text);
                if (text !== state.search) setState({ ...state, page: 1, search: text });
              }}
            />
          )}
          {toolbar}
          <div className="ml-auto flex gap-2">
            {exportName && (
              <Button variant="outline" leftIcon={Download} disabled={!found.length} onClick={exportRows}>
                {uiText.exportCsv}
              </Button>
            )}
            {columnPicker && (
              <DropdownMenu
                items={menu}
                trigger={(p) => <IconButton icon={Columns3} variant="outline" label={uiText.columns} {...p} />}
              />
            )}
          </div>
        </div>
      )}

      {selectable && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary bg-primary-subtle px-3 py-1.5 text-sm">
          <span role="status" className="font-medium">
            {uiText.selectedCount(selected.length)}
          </span>
          {bulkActions?.(selected, clear)}
          <Button size="sm" variant="link" className="ml-auto" onClick={clear}>
            {uiText.clearSelection}
          </Button>
        </div>
      )}

      {error && data && <ErrorState className="rounded-md border border-danger p-3" message={error} onRetry={onRetry} />}

      <div aria-busy={isLoading || isFetching || undefined} className="relative overflow-hidden rounded-md border border-line bg-surface">
        {isFetching && data && (
          <div aria-hidden className="absolute inset-x-0 top-0 z-(--z-sticky) h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-indeterminate bg-primary" />
          </div>
        )}
        {body}
      </div>

      {!hidePagination && data && total > 0 && (
        <Pagination
          page={page}
          pageSize={state.pageSize}
          total={total}
          {...(pageSizes ? { pageSizes } : {})}
          onPageChange={(next) => setState({ ...state, page: next })}
          onPageSizeChange={(pageSize) => setState({ ...state, page: 1, pageSize })}
        />
      )}
    </div>
  );
}
