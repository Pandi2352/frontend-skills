import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { InfiniteList, type CursorPage } from './index';

interface Item { id: string }
const getKey = (i: Item) => i.id;
const draw = (i: Item) => `Item ${i.id}`;

function List({ load }: { load: (cursor: string | null) => Promise<CursorPage<Item>> }) {
  const query = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });
  return <InfiniteList label="Items" query={query} getKey={getKey} renderItem={draw} className="h-96" />;
}
const show = (load: (cursor: string | null) => Promise<CursorPage<Item>>) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <List load={load} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  // jsdom has no layout.
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50);
});

it('loads the next page, shows a repeated item once, and stops at the end', async () => {
  const load = vi.fn(async (cursor: string | null): Promise<CursorPage<Item>> =>
    cursor ? { items: [{ id: '2' }, { id: '3' }], nextCursor: null } : { items: [{ id: '1' }, { id: '2' }], nextCursor: 'x' });
  show(load);
  expect(await screen.findByText('Item 3')).toBeVisible();
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(load).toHaveBeenCalledTimes(2);
});

it('keeps the items when loading more fails, and retries', async () => {
  let online = false;
  show(async (cursor) => {
    if (cursor && !online) throw new Error('Offline');
    return cursor ? { items: [{ id: '2' }], nextCursor: null } : { items: [{ id: '1' }], nextCursor: 'x' };
  });
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.getByText('Item 1')).toBeVisible();
  online = true;
  await userEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0] as HTMLElement);
  expect(await screen.findByText('Item 2')).toBeVisible();
});

it('shows empty', async () => {
  show(async () => ({ items: [], nextCursor: null }));
  expect(await screen.findByText('Nothing here yet')).toBeVisible();
});
