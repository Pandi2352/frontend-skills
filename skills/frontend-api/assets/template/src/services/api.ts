import { env } from '@/config/env';
import { createApiClient } from './api-client';
import { ApiError } from './api-error';
import { session } from './session';

/** The client every feature service uses. */
export const api = createApiClient({
  baseUrl: env.apiUrl,
  getToken: session.getToken,
  onSessionEnd: session.end,
  refresh: async () => {
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/refresh', undefined, { skipAuth: true });
      session.setToken(accessToken);
      return accessToken;
    } catch (error) {
      // Only a clear "no" ends the session. Network failures do not.
      if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
        session.setToken(null);
        return null;
      }
      throw error;
    }
  },
});
