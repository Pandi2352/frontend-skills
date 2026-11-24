import { api } from '@/services/api';
import { session } from '@/services/session';
import type { AuthUser, Credentials } from '../types/auth.types';

// The only file to change for other endpoints.
export const authService = {
  async signIn(credentials: Credentials): Promise<AuthUser> {
    const { accessToken } = await api.post<{ accessToken: string }>('/auth/login', credentials, { skipAuth: true });
    session.setToken(accessToken);
    return api.get<AuthUser>('/auth/me');
  },

  /** The person signed in before a reload, or null. Throws when the server is unreachable. */
  async restore(): Promise<AuthUser | null> {
    const token = await api.refresh();
    return token ? api.get<AuthUser>('/auth/me') : null;
  },

  async signOut(): Promise<void> {
    await api.post('/auth/logout', undefined, { skipAuth: true });
  },
};
