import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { InfiniteList } from '@/components/shared/infinite-list';
import { EmptyState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { uiText } from '@/constants/ui-text';
import { safePath } from '@/features/auth/utils/safe-path';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/services/api-error';
import { useMarkRead, useNotifications, useUnreadCount } from '../hooks/useNotifications';
import type { AppNotification } from '../services/notifications.service';
import { formatTimeAgo } from '../utils/time-ago';

const getId = (n: AppNotification) => n.id;

export function NotificationsPage() {
  const navigate = useNavigate();
  const list = useNotifications();
  const unread = useUnreadCount().data ?? 0;
  const markRead = useMarkRead();
  const onError = (error: unknown) => toast.error(getErrorMessage(error));

  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id, { onError });
    if (n.link) void navigate(safePath(n.link));
  };

  return (
    <PageContainer className="h-full">
      <PageHeader
        title={uiText.notifications}
        actions={
          <Button variant="outline" leftIcon={CheckCheck} disabled={!unread} onClick={() => markRead.mutate(undefined, { onError })}>
            {uiText.markAllRead}
          </Button>
        }
      />
      <InfiniteList
        label={uiText.notifications}
        query={list}
        getKey={getId}
        empty={<EmptyState icon={Bell} title={uiText.noNotifications} />}
        className="min-h-0 flex-1 rounded-md border border-line bg-surface"
        renderItem={(n) => (
          // scan-ok: the whole row is the button
          <button
            type="button"
            onClick={() => open(n)}
            className="flex w-full gap-3 border-b border-line px-4 py-3 text-start text-sm hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          >
            <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', !n.read && 'bg-primary')} />
            <span className="min-w-0 flex-1">
              <span className={cn('block break-words', !n.read && 'font-medium')}>
                {n.title}
                {!n.read && <span className="sr-only"> ({uiText.unreadItem})</span>}
              </span>
              {n.description && <span className="block break-words text-muted">{n.description}</span>}
            </span>
            <time dateTime={n.createdAt} className="shrink-0 text-xs text-muted">{formatTimeAgo(n.createdAt)}</time>
          </button>
        )}
      />
    </PageContainer>
  );
}
