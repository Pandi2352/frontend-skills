import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { AsyncView } from '@/components/shared/states';
import { VirtualList } from '@/components/shared/virtual-list';
import { getErrorMessage } from '@/services/api-error';

/** What the server sends for one part of a long list. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export interface InfiniteListProps<T> {
  label: string;
  /** From `useInfiniteQuery` with `CursorPage` pages. */
  query: UseInfiniteQueryResult<{ pages: CursorPage<T>[] }>;
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  loader?: ReactNode;
  estimateHeight?: number;
  gap?: number;
  /** Needs a height, e.g. "h-96" or "h-full". */
  className?: string;
}

/** Long list that loads more while scrolling, with loading, empty, error and retry. */
export function InfiniteList<T>(props: InfiniteListProps<T>) {
  const { label, query, getKey, renderItem, empty, loader, estimateHeight, gap, className } = props;
  const pages = query.data?.pages;
  // New rows on the server can move an item to the next page; show it once.
  const items = useMemo(() => {
    if (!pages) return undefined;
    const byKey = new Map(pages.flatMap((p) => p.items).map((item) => [getKey(item), item]));
    return [...byKey.values()];
  }, [pages, getKey]);
  const total = pages?.at(-1)?.total;
  const message = query.error ? getErrorMessage(query.error) : undefined;

  return (
    <AsyncView
      data={items}
      isLoading={query.isPending}
      error={message}
      onRetry={() => void query.refetch()}
      isEmpty={(list) => list.length === 0}
      {...(empty === undefined ? {} : { empty })}
      {...(loader === undefined ? {} : { loader })}
    >
      {(list) => (
        <VirtualList
          label={label}
          items={list}
          getKey={getKey}
          renderItem={renderItem}
          hasMore={query.hasNextPage}
          isLoadingMore={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
          error={query.isFetchNextPageError ? message : undefined}
          {...(total === undefined ? {} : { total })}
          {...(estimateHeight === undefined ? {} : { estimateHeight })}
          {...(gap === undefined ? {} : { gap })}
          {...(className === undefined ? {} : { className })}
        />
      )}
    </AsyncView>
  );
}
