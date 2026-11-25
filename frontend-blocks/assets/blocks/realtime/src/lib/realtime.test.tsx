import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeContext, useRealtimeInvalidate } from '@/hooks/useRealtime';
import { createRealtime } from './realtime';

class FakeSocket {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = () => {
  const sockets: FakeSocket[] = [];
  const getUrl = vi.fn(async () => 'wss://x/y');
  const client = createRealtime({
    getUrl,
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket as unknown as WebSocket;
    },
  });
  return { client, sockets, getUrl };
};
const settle = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('realtime', () => {
  it('delivers messages, ignores broken ones, and unsubscribes', async () => {
    const { client, sockets } = setup();
    const got = vi.fn();
    const stop = client.on('order', got);
    client.connect();
    await settle();
    sockets[0]?.onopen?.();
    expect(client.getStatus()).toBe('open');
    sockets[0]?.onmessage?.({ data: 'not json' });
    sockets[0]?.onmessage?.({ data: '{"type":"order","data":1}' });
    expect(got).toHaveBeenCalledExactlyOnceWith(1);
    stop();
    sockets[0]?.onmessage?.({ data: '{"type":"order","data":2}' });
    expect(got).toHaveBeenCalledTimes(1);
    client.disconnect();
  });

  it('comes back after a break with a new address, and tells about it', async () => {
    const { client, sockets, getUrl } = setup();
    const again = vi.fn();
    client.onReconnect(again);
    client.connect();
    await settle();
    sockets[0]?.onopen?.();
    expect(again).not.toHaveBeenCalled();
    sockets[0]?.onclose?.();
    expect(client.getStatus()).toBe('connecting');
    await settle(2000);
    expect(getUrl).toHaveBeenCalledTimes(2);
    sockets[1]?.onopen?.();
    expect(again).toHaveBeenCalledTimes(1);
    client.disconnect();
  });

  it('never reconnects after disconnect, also when the address arrives late', async () => {
    const { client, sockets } = setup();
    client.connect();
    client.disconnect();
    await settle(60_000);
    expect(sockets).toHaveLength(0);
    expect(client.getStatus()).toBe('closed');
  });

  it('many messages cause one reload of the query', async () => {
    const { client, sockets } = setup();
    const queries = new QueryClient();
    const invalidate = vi.spyOn(queries, 'invalidateQueries');
    renderHook(() => useRealtimeInvalidate('order', ['orders']), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queries}><RealtimeContext value={client}>{children}</RealtimeContext></QueryClientProvider>
      ),
    });
    client.connect();
    await settle();
    sockets[0]?.onopen?.();
    for (let i = 0; i < 5; i++) sockets[0]?.onmessage?.({ data: '{"type":"order"}' });
    await settle(400);
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ['orders'] });
    client.disconnect();
  });
});
