/** Runs work when the browser is free: analytics, chat widgets, warming up code. Returns a cancel. */
export function whenIdle(work: () => void, timeout = 3000) {
  // Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback !== 'function') {
    const timer = setTimeout(work, 200);
    return () => clearTimeout(timer);
  }
  const id = window.requestIdleCallback(work, { timeout });
  return () => window.cancelIdleCallback(id);
}
