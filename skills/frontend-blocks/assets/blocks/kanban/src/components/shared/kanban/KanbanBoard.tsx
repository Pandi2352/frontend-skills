import type { ReactNode } from 'react';
import { ErrorState } from '@/components/shared/states';
import { DragHandle } from '@/components/shared/sortable-list';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDragSort, type DragMove } from '@/hooks/useDragSort';
import { cn } from '@/lib/cn';

export interface KanbanColumn {
  id: string;
  title: string;
  /** Shows a warning when there are more cards. */
  limit?: number;
}

export const kanbanText = {
  empty: 'No cards',
  overLimit: (limit: number) => `More than the limit of ${limit}`,
};

export interface KanbanBoardProps<T> {
  label: string;
  columns: KanbanColumn[];
  cards: readonly T[] | undefined;
  getId: (card: T) => string;
  getName: (card: T) => string;
  /** Column of a card. The order of `cards` is the order inside a column. */
  getColumn: (card: T) => string;
  renderCard: (card: T) => ReactNode;
  /** Change the data at once, save, and undo if saving fails. */
  onMove: (move: DragMove) => void;
  /** Menu or button in the column header. */
  columnActions?: (column: KanbanColumn) => ReactNode;
  /** Below the cards, e.g. an "Add card" button. */
  columnFooter?: (column: KanbanColumn) => ReactNode;
  isLoading?: boolean;
  error?: string | undefined;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
}

/** Applies a move to the cards, for optimistic updates. */
export function applyKanbanMove<T>(
  cards: readonly T[],
  move: DragMove,
  getId: (card: T) => string,
  getColumn: (card: T) => string,
  setColumn: (card: T, column: string) => T,
): T[] {
  const card = cards.find((c) => getId(c) === move.id);
  if (!card) return [...cards];
  const rest = cards.filter((c) => getId(c) !== move.id);
  const inColumn = rest.filter((c) => getColumn(c) === move.toList);
  const before = inColumn[move.index];
  const at = before ? rest.indexOf(before) : rest.length;
  return [...rest.slice(0, at), setColumn(card, move.toList), ...rest.slice(at)];
}

/** Columns scroll sideways; on phones one column fills most of the screen. */
export function KanbanBoard<T>(props: KanbanBoardProps<T>) {
  const {
    label, columns, cards, getId, getName, getColumn, renderCard, onMove, columnActions, columnFooter,
    isLoading, error, onRetry, disabled = false, className,
  } = props;
  const byId = new Map((cards ?? []).map((card) => [getId(card), card]));
  const sort = useDragSort({
    lists: columns.map((c) => ({
      id: c.id,
      label: c.title,
      items: (cards ?? []).filter((card) => getColumn(card) === c.id).map(getId),
    })),
    getName: (id) => {
      const card = byId.get(id);
      return card === undefined ? '' : getName(card);
    },
    onMove,
    disabled,
  });

  if (error && !cards) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <>
      <div
        role="region"
        aria-label={label}
        aria-busy={isLoading || undefined}
        // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- scroll areas must be reachable by keyboard
        tabIndex={0}
        className={cn('flex snap-x items-start gap-4 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-focus', className)}
      >
        {sort.lists.map((list, n) => {
          const column = columns[n];
          if (!column) return null;
          const over = column.limit !== undefined && list.items.length > column.limit;
          return (
            <section
              key={list.id}
              aria-label={column.title}
              {...sort.listProps(list.id)}
              className={cn(
                'flex w-[80vw] max-w-72 shrink-0 snap-start flex-col gap-2 rounded-md border bg-subtle p-2 sm:w-72',
                sort.draggingId && sort.overList === list.id ? 'border-primary' : 'border-line',
              )}
            >
              <div className="flex min-h-control-sm items-center gap-2 px-1">
                <h2 className="min-w-0 truncate text-sm font-semibold">{column.title}</h2>
                <Badge size="sm" variant={over ? 'warning' : 'neutral'}>
                  {column.limit === undefined ? list.items.length : `${list.items.length} / ${column.limit}`}
                  {over && <span className="sr-only"> {kanbanText.overLimit(column.limit ?? 0)}</span>}
                </Badge>
                <span className="ms-auto flex">{columnActions?.(column)}</span>
              </div>
              {!cards && isLoading ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : (
                <ul className="flex min-h-16 flex-col gap-2">
                  {list.items.map((id) => {
                    const card = byId.get(id);
                    return (
                      card !== undefined && (
                        <li
                          key={id}
                          {...sort.itemProps(id)}
                          className={cn('flex items-start gap-1 rounded-md border bg-surface p-2 text-sm', sort.draggingId === id ? 'border-primary bg-primary-subtle' : 'border-line')}
                        >
                          <div className="min-w-0 flex-1 break-words">{renderCard(card)}</div>
                          <DragHandle {...sort.handleProps(id)} />
                        </li>
                      )
                    );
                  })}
                  {!list.items.length && <li className="p-4 text-center text-sm text-muted">{kanbanText.empty}</li>}
                </ul>
              )}
              {columnFooter?.(column)}
            </section>
          );
        })}
      </div>
      <span role="status" className="sr-only">{sort.message}</span>
    </>
  );
}
