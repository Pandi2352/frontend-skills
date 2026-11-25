import type { CursorPage } from '@/components/shared/infinite-list';
import { api } from '@/services/api';

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  /** ISO time */
  createdAt: string;
  read: boolean;
  /** Path inside this app. */
  link?: string;
}

// The only file to change for other endpoints.
export const notificationsService = {
  list: (cursor: string | null, signal?: AbortSignal) =>
    api.get<CursorPage<AppNotification>>('/notifications', { query: { cursor }, signal }),
  unreadCount: (signal?: AbortSignal) => api.get<{ count: number }>('/notifications/unread-count', { signal }),
  markRead: (id: string) => api.post<void>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => api.post<void>('/notifications/read-all'),
};
