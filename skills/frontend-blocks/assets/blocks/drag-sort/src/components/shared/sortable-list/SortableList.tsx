import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDragSort } from '@/hooks/useDragSort';
import { cn } from '@/lib/cn';

/** The grip that starts a drag. */
export function DragHandle({ className, ...props }: ReturnType<ReturnType<typeof useDragSort>['handleProps']> & { className?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex size-control-sm shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground',
        'focus-visible:outline-2 focus-visible:outline-focus active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <GripVertical aria-hidden className="size-4" />
    </button>
  );
}

export interface SortableListProps<T> {
  label: string;
  items: readonly T[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** The list in its new order. Save it, and put the old one back if saving fails. */
  onReorder: (items: T[], moved: { item: T; from: number; to: number }) => void;
  disabled?: boolean;
  className?: string;
}

/** Order by dragging, or with the keyboard on the handle. */
export function SortableList<T>(props: SortableListProps<T>) {
  const { label, items, getId, getName, renderItem, onReorder, disabled = false, className } = props;
  const byId = new Map(items.map((item) => [getId(item), item]));
  const ids = [...byId.keys()];
  const find = (id: string) => byId.get(id) as T;
  const sort = useDragSort({
    lists: [{ id: 'list', label, items: ids }],
    getName: (id) => getName(find(id)),
    disabled,
    onMove: ({ id, index }) => {
      const rest = ids.filter((i) => i !== id);
      onReorder([...rest.slice(0, index), id, ...rest.slice(index)].map(find), { item: find(id), from: ids.indexOf(id), to: index });
    },
  });
  return (
    <>
      <ol aria-label={label} {...sort.listProps('list')} className={cn('divide-y divide-line rounded-md border border-line bg-surface', className)}>
        {sort.lists[0]?.items.map((id, i) => (
          <li key={id} {...sort.itemProps(id)} className={cn('flex items-center gap-2 px-2 py-1.5', sort.draggingId === id && 'bg-primary-subtle')}>
            <DragHandle {...sort.handleProps(id)} />
            <div className="min-w-0 flex-1">{renderItem(find(id), i)}</div>
          </li>
        ))}
      </ol>
      <span role="status" className="sr-only">{sort.message}</span>
    </>
  );
}
