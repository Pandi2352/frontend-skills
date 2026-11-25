export type RealtimeStatus = 'connecting' | 'open' | 'closed';

export interface RealtimeMessage {
  type: string;
  data?: unknown;
}

export interface RealtimeOptions {
  /** Called for each connection, so a new short-lived ticket can be in the address. Never a long-lived token. */
  getUrl: () => string | Promise<string>;
  /** For tests. */
  createSocket?: (url: string) => WebSocket;
  maxDelay?: number;
}

/**
 * One shared WebSocket with reconnect, growing pauses, and a pause while offline.
 * The server sends JSON: `{ "type": "order.changed", "data": … }`.
 */
export function createRealtime({ getUrl, createSocket = (url) => new WebSocket(url), maxDelay = 30_000 }: RealtimeOptions) {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  const statusListeners = new Set<() => void>();
  const reconnectListeners = new Set<() => void>();
  let socket: WebSocket | null = null;
  let status: RealtimeStatus = 'closed';
  let wanted = false;
  let failures = 0;
  let wasOpen = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // A connection that is no longer wanted must not change anything.
  let generation = 0;

  const setStatus = (next: RealtimeStatus) => {
    if (next === status) return;
    status = next;
    statusListeners.forEach((run) => run());
  };

  const retry = () => {
    setStatus('connecting');
    failures++;
    // Random, so not all clients come back in the same second.
    const wait = Math.min(maxDelay, 500 * 2 ** failures) * (0.5 + Math.random() / 2);
    clearTimeout(timer);
    timer = setTimeout(() => void open(), wait);
  };

  async function open() {
    if (!wanted || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    const mine = ++generation;
    setStatus('connecting');
    let url: string;
    try {
      url = await getUrl();
    } catch {
      if (mine === generation && wanted) retry();
      return;
    }
    if (mine !== generation || !wanted) return;
    const next = createSocket(url);
    socket = next;
    next.onopen = () => {
      if (mine !== generation) return;
      failures = 0;
      setStatus('open');
      // Messages may have been missed meanwhile.
      if (wasOpen) reconnectListeners.forEach((run) => run());
      wasOpen = true;
    };
    next.onmessage = (event) => {
      if (mine !== generation) return;
      let message: RealtimeMessage;
      try {
        message = JSON.parse(String(event.data)) as RealtimeMessage;
      } catch {
        return;
      }
      handlers.get(message.type)?.forEach((run) => run(message.data));
    };
    next.onclose = () => {
      if (mine === generation && wanted) retry();
    };
  }

  const online = () => {
    if (status === 'open') return;
    failures = 0;
    clearTimeout(timer);
    void open();
  };

  return {
    connect() {
      if (wanted) return;
      wanted = true;
      window.addEventListener('online', online);
      void open();
    },
    /** On sign-out. */
    disconnect() {
      wanted = false;
      generation++;
      failures = 0;
      wasOpen = false;
      clearTimeout(timer);
      window.removeEventListener('online', online);
      socket?.close();
      socket = null;
      setStatus('closed');
    },
    /** Returns false when not connected; nothing is kept for later. */
    send(message: RealtimeMessage) {
      if (status !== 'open' || !socket) return false;
      socket.send(JSON.stringify(message));
      return true;
    },
    on(type: string, run: (data: unknown) => void) {
      const set = handlers.get(type) ?? new Set();
      handlers.set(type, set.add(run));
      return () => {
        set.delete(run);
        if (!set.size) handlers.delete(type);
      };
    },
    /** After a break: load the data again. */
    onReconnect(run: () => void) {
      reconnectListeners.add(run);
      return () => void reconnectListeners.delete(run);
    },
    subscribeStatus(run: () => void) {
      statusListeners.add(run);
      return () => void statusListeners.delete(run);
    },
    getStatus: () => status,
  };
}

export type Realtime = ReturnType<typeof createRealtime>;
