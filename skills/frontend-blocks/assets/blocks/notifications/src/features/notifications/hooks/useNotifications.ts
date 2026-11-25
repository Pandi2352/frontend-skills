import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { CursorPage } from '@/components/shared/infinite-list';
import { notificationsService, type AppNotification } from '../services/notifications.service';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export const useNotifications = (enabled = true) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam, signal }) => notificationsService.list(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled,
  });

/** Checked every minute while the tab is visible. With realtime, remove the interval. */
export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: ({ signal }) => notificationsService.unreadCount(signal),
    select: (data) => data.count,
    refetchInterval: 60_000,
  });

type Pages = InfiniteData<CursorPage<AppNotification>, string | null>;

/** Shown at once, undone when saving fails. Without an id: all of them. */
export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id === undefined ? notificationsService.markAllRead() : notificationsService.markRead(id)),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: notificationKeys.all });
      const list = client.getQueryData<Pages>(notificationKeys.list());
      const unread = client.getQueryData<{ count: number }>(notificationKeys.unread());
      const wasUnread = list?.pages.some((p) => p.items.some((n) => n.id === id && !n.read));
      client.setQueryData<Pages>(notificationKeys.list(), list && {
        ...list,
        pages: list.pages.map((p) => ({ ...p, items: p.items.map((n) => (id === undefined || n.id === id ? { ...n, read: true } : n)) })),
      });
      client.setQueryData(notificationKeys.unread(), unread && {
        count: id === undefined ? 0 : Math.max(0, unread.count - (wasUnread ? 1 : 0)),
      });
      return { list, unread };
    },
    onError: (_error, _id, before) => {
      client.setQueryData(notificationKeys.list(), before?.list);
      client.setQueryData(notificationKeys.unread(), before?.unread);
    },
    onSettled: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
