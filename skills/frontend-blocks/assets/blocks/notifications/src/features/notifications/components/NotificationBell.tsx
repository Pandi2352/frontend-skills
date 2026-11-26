import { useNavigate } from 'react-router-dom';
import { NotificationMenu } from '@/components/layout/navbar';
import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/config/routes';
import { safePath } from '@/features/auth/utils/safe-path';
import { getErrorMessage } from '@/services/api-error';
import { useMarkRead, useNotifications, useUnreadCount } from '../hooks/useNotifications';
import { formatTimeAgo } from '../utils/time-ago';

/** For the navbar. */
export function NotificationBell() {
  const navigate = useNavigate();
  const list = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const onError = (error: unknown) => toast.error(getErrorMessage(error));
  const items = list.data?.pages[0]?.items.slice(0, 8);

  return (
    <NotificationMenu
      items={items?.map((n) => ({ ...n, time: formatTimeAgo(n.createdAt) }))}
      unreadCount={unread.data ?? 0}
      isLoading={list.isPending}
      {...(list.error ? { error: getErrorMessage(list.error) } : {})}
      onRetry={() => void list.refetch()}
      onMarkAllRead={() => markRead.mutate(undefined, { onError })}
      onViewAll={() => void navigate(ROUTES.notifications)}
      onOpenItem={({ id, read }) => {
        if (!read) markRead.mutate(id, { onError });
        const link = items?.find((n) => n.id === id)?.link;
        // Links come from the server's data; only paths of this app are opened.
        if (link) void navigate(safePath(link, ROUTES.notifications));
      }}
    />
  );
}
