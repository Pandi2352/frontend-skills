import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { Realtime } from '@/lib/realtime';
import { useStableCallback } from './useStableCallback';

/** `<RealtimeContext value={realtime}>` inside the signed-in part of the app. */
export const RealtimeContext = createContext<Realtime | null>(null);

function useClient() {
  const client = useContext(RealtimeContext);
  if (!client) throw new Error('useRealtime needs RealtimeContext');
  return client;
}

/** Connects while the component is shown. Use once, in the signed-in layout. */
export function useRealtimeConnection(client: Realtime) {
  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);
}

export function useRealtimeStatus() {
  const client = useClient();
  return useSyncExternalStore(client.subscribeStatus, client.getStatus);
}

/** Runs for each message of this type. Check `data`: it comes from outside. */
export function useRealtimeMessage(type: string, run: (data: unknown) => void) {
  const client = useClient();
  const latest = useStableCallback(run);
  useEffect(() => client.on(type, latest), [client, type, latest]);
}

/**
 * Loads a query again when the server says it changed, and after a lost
 * connection. Many messages at once cause one request.
 */
export function useRealtimeInvalidate(type: string, queryKey: QueryKey, wait = 300) {
  const client = useClient();
  const queries = useQueryClient();
  const key = JSON.stringify(queryKey);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void queries.invalidateQueries({ queryKey: JSON.parse(key) as QueryKey }), wait);
    };
    const stops = [client.on(type, run), client.onReconnect(run)];
    return () => {
      clearTimeout(timer);
      stops.forEach((stop) => stop());
    };
  }, [client, queries, type, key, wait]);
}
