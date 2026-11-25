// The access token stays in memory: scripts on the page cannot read it from
// storage, and a reload restores it with the httpOnly refresh cookie.
let token: string | null = null;
const listeners = new Set<() => void>();
// scan-ok: one channel for the whole life of the app
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('session');

const end = () => {
  token = null;
  listeners.forEach((run) => run());
};
if (channel) channel.onmessage = (event) => event.data === 'end' && end();

export const session = {
  getToken: () => token,
  setToken: (next: string | null) => {
    token = next;
  },
  /** Ends the session here and in other tabs. */
  end: () => {
    end();
    channel?.postMessage('end');
  },
  onEnd: (run: () => void) => {
    listeners.add(run);
    return () => {
      listeners.delete(run);
    };
  },
};
