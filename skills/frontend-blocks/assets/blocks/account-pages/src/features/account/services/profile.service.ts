import type { AuthUser } from '@/features/auth';
import { api } from '@/services/api';

export interface ProfileInput {
  name: string;
  phone: string;
}

export interface Profile extends ProfileInput {
  email: string;
  avatarUrl: string | null;
}

export interface Preferences {
  timezone: string;
  emailNews: boolean;
  emailActivity: boolean;
  desktopAlerts: boolean;
}

// The only file to change for other endpoints.
export const profileService = {
  get: (signal?: AbortSignal) => api.get<Profile>('/me/profile', { signal }),
  update: (input: ProfileInput) => api.patch<AuthUser>('/me/profile', input),
  setAvatar: (file: File) => {
    const data = new FormData();
    data.append('file', file);
    return api.post<AuthUser>('/me/avatar', data);
  },
  removeAvatar: () => api.delete<AuthUser>('/me/avatar'),
  getPreferences: (signal?: AbortSignal) => api.get<Preferences>('/me/preferences', { signal }),
  setPreferences: (input: Partial<Preferences>) => api.patch<Preferences>('/me/preferences', input),
};
