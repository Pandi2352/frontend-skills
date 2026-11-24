import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api-error';

/** Retry reads that may work next time. Never retry a refusal. */
export function shouldRetry(failures: number, error: unknown) {
  if (failures >= 2 || !(error instanceof ApiError)) return false;
  return error.kind !== 'http' || [502, 503, 504].includes(error.status);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
