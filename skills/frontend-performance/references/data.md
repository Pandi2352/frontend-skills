# Data

With `frontend-api` and TanStack Query. Without it the same rules apply.

## No waterfalls

A child that fetches only after its parent has finished is the most common reason
for slow pages.

```ts
const [users, roles] = useSuspenseQueries({ queries: [usersQuery(params), rolesQuery()] });  // together
const [a, b] = await Promise.all([getA(signal), getB(signal)]);                              // not await, await
```

- Ask for dependent data in one endpoint when the backend can.
- Never one request per row. Ask for the list with the fields it shows.
- Start data with the page code: one `queryOptions` object used by the page, the
  route loader and the hover prefetch.

```ts
export const userQuery = (id: string) =>
  queryOptions({ queryKey: userKeys.detail(id), queryFn: ({ signal }) => usersService.get(id, signal), staleTime: 60_000 });

// route
loader: ({ params }) => { void queryClient.prefetchQuery(userQuery(params.id ?? '')); return null; }
// row
onPointerEnter={() => void queryClient.prefetchQuery(userQuery(user.id))}
```

Prefetch only what is likely next, never every row on screen.

## Cache

| Data | `staleTime` |
| --- | --- |
| countries, roles, settings | 10 min to Infinity |
| lists, details | 30 s (default) |
| prices, stock, live status | 0, or push updates |

- Same key, same request: duplicates are joined, so components may ask for what
  they need. Keys come from one factory, with every parameter in them.
- `select` for a small part, so other changes do not redraw.
- After a mutation invalidate the smallest key; write the returned object into the
  detail cache instead of fetching it again.
- `placeholderData: keepPreviousData` for pages and filters.
- Polling only while visible (`refetchIntervalInBackground` stays false), 10 s or
  slower. Live data: one shared SSE or WebSocket connection, updates grouped.

## Search

Debounce 300 ms, at least 2 characters when the server asks for it, pass `signal`
so old requests are cancelled, keep old results while loading.

## Infinite list

```tsx
const feed = useInfiniteQuery({
  queryKey: feedKeys.list(filter),
  queryFn: ({ pageParam, signal }) => feedService.list({ ...filter, cursor: pageParam }, signal),
  initialPageParam: null as string | null,
  getNextPageParam: (page) => page.nextCursor,
});
const items = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data]);

<VirtualList label="Orders" className="h-full" items={items} getKey={getOrderId} renderItem={drawOrder}
  hasMore={feed.hasNextPage} isLoadingMore={feed.isFetchingNextPage} onLoadMore={feed.fetchNextPage}
  error={feed.isFetchNextPageError ? getErrorMessage(feed.error) : undefined} />
```

Cursors, not page numbers, when rows can be added meanwhile.

## Optimistic change

Only for small, safe, reversible actions (like, rename, toggle). Cancel the query,
keep the old value, write the new one, restore it on error, invalidate at the end.
Never for payments, deletes or anything the server may refuse.

## Size

Ask for pages of 20 to 100 rows. Compress responses. Uploads go directly to
storage with a signed URL when large. Parse files over 1 MB in a worker.
