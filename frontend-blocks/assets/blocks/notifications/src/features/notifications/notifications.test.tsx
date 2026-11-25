import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMarkRead, useNotifications, useUnreadCount } from './hooks/useNotifications';
import { notificationsService } from './services/notifications.service';
import { formatTimeAgo } from './utils/time-ago';

vi.mock('./services/notifications.service', () => ({
  notificationsService: { list: vi.fn(), unreadCount: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}));
const service = vi.mocked(notificationsService);
const item = (id: string, read = false) => ({ id, title: id, createdAt: '2026-01-01T00:00:00Z', read });

beforeEach(() => {
  vi.resetAllMocks();
  service.list.mockResolvedValue({ items: [item('a'), item('b', true)], nextCursor: null });
  service.unreadCount.mockResolvedValue({ count: 1 });
});

const setup = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => ({ list: useNotifications(), unread: useUnreadCount(), mark: useMarkRead() }), { wrapper });
  await waitFor(() => expect(result.current.unread.data).toBe(1));
  await waitFor(() => expect(result.current.list.data).toBeDefined());
  return result;
};

it('marks one as read at once and counts it only once', async () => {
  let finish: () => void = () => undefined;
  service.markRead.mockReturnValue(new Promise((done) => { finish = () => done(undefined); }));
  const result = await setup();
  act(() => result.current.mark.mutate('a'));
  await waitFor(() => expect(result.current.unread.data).toBe(0));
  expect(result.current.list.data?.pages[0]?.items.every((n) => n.read)).toBe(true);
  act(() => result.current.mark.mutate('b'));
  expect(result.current.unread.data).toBe(0);
  await act(async () => finish());
});

it('undoes when saving fails', async () => {
  service.markAllRead.mockRejectedValue(new Error('offline'));
  const result = await setup();
  await act(async () => {
    await result.current.mark.mutateAsync(undefined).catch(() => undefined);
  });
  await waitFor(() => expect(result.current.unread.data).toBe(1));
  expect(result.current.list.data?.pages[0]?.items[0]?.read).toBe(false);
});

it('writes times in words', () => {
  const now = Date.parse('2026-01-02T00:00:00Z');
  expect(formatTimeAgo('2026-01-01T23:55:00Z', now)).toBe('5 minutes ago');
  expect(formatTimeAgo('2026-01-01T00:00:00Z', now)).toBe('yesterday');
  expect(formatTimeAgo('2026-01-02T00:00:00Z', now)).toBe('now');
  expect(formatTimeAgo('nonsense', now)).toBe('');
});
