import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loader';
import { uiText } from '@/constants/ui-text';
import { useStableCallback } from '@/hooks/useStableCallback';
import { cn } from '@/lib/cn';

export interface VirtualListProps<T> {
  /** Read by screen readers. */
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Usual height in pixels. Real heights are measured. */
  estimateHeight?: number;
  /** Space between items in pixels. */
  gap?: number;

  /** Loads more when the end is near. */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** The last load failed. Loading waits for the button. */
  error?: string | undefined;
  /** All items on the server, if known. */
  total?: number;

  /** Needs a height, e.g. "h-96" or "h-full". */
  className?: string;
}

/**
 * Long list that draws only what is on screen, with infinite loading. Use from
 * about 100 items. For fewer, a normal list is simpler and can be searched by
 * the browser.
 */
export function VirtualList<T>(props: VirtualListProps<T>) {
  'use no memo'; // The virtualizer changes inside, which React Compiler cannot see.
  const {
    label, items, getKey, renderItem, estimateHeight = 56, gap = 0,
    hasMore = false, isLoadingMore = false, onLoadMore, error, total, className,
  } = props;
  const scroller = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- handled by "use no memo"
  const list = useVirtualizer({
    count: items.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => estimateHeight,
    getItemKey: (index) => {
      const item = items[index];
      return item === undefined ? index : getKey(item);
    },
    gap,
    overscan: 6,
  });
  const shown = list.getVirtualItems();
  const last = shown.at(-1)?.index ?? -1;

  const loadMore = useStableCallback(() => onLoadMore?.());
  const nearEnd = items.length > 0 && last >= items.length - 5;
  useEffect(() => {
    if (nearEnd && hasMore && !isLoadingMore && !error) loadMore();
    // items.length: a short page can end near the end again.
  }, [nearEnd, hasMore, isLoadingMore, error, items.length, loadMore]);

  return (
    <div
      ref={scroller}
      role="region"
      aria-label={label}
      // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- scroll areas must be reachable by keyboard
      tabIndex={0}
      className={cn(
        'overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        className,
      )}
    >
      <ul className="relative" style={{ height: list.getTotalSize() }}>
        {shown.map(({ key, index, start }) => {
          const item = items[index];
          if (item === undefined) return null;
          return (
            <li
              key={key}
              ref={list.measureElement}
              data-index={index}
              aria-posinset={index + 1}
              aria-setsize={total ?? (hasMore ? -1 : items.length)}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${start}px)` }}
            >
              {renderItem(item, index)}
            </li>
          );
        })}
      </ul>
      {isLoadingMore && (
        <div className="flex justify-center p-3">
          <Spinner label={uiText.loading} />
        </div>
      )}
      {error && !isLoadingMore && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 p-3 text-sm text-danger">
          {error}
          <Button size="sm" variant="outline" onClick={loadMore}>
            {uiText.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
