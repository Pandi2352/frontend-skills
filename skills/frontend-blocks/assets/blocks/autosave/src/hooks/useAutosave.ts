import { useCallback, useEffect, useRef, useState } from 'react';
import { useStableCallback } from './useStableCallback';

export type AutosaveState = 'saved' | 'waiting' | 'saving' | 'failed';

/**
 * Saves a moment after the last change. Saves never overlap: a change during a
 * save is saved afterwards, so the newest value always wins on the server.
 */
export function useAutosave<T>(options: {
  value: T;
  /** `signal` ends when the page closes. Throw when saving fails. */
  save: (value: T, signal: AbortSignal) => Promise<unknown>;
  delay?: number;
  /** false while the value is invalid. */
  enabled?: boolean;
  isEqual?: (a: T, b: T) => boolean;
}) {
  const { value, delay = 1000, enabled = true, isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b) } = options;
  const [state, setState] = useState<AutosaveState>('saved');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saved = useRef(value);
  const latest = useRef(value);
  const running = useRef<AbortController>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const same = useStableCallback(isEqual);
  const send = useStableCallback(options.save);
  const allowed = useRef(enabled);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (running.current) return; // The running save continues with the newest value.
    const controller = new AbortController();
    running.current = controller;
    try {
      while (allowed.current && !same(latest.current, saved.current)) {
        const sending = latest.current;
        setState('saving');
        // eslint-disable-next-line no-await-in-loop -- saves must not overlap
        await send(sending, controller.signal);
        saved.current = sending;
        setSavedAt(new Date());
      }
      setState(same(latest.current, saved.current) ? 'saved' : 'waiting');
    } catch {
      if (!controller.signal.aborted) setState('failed');
    } finally {
      running.current = null;
    }
  }, [same, send]);

  useEffect(() => {
    latest.current = value;
    allowed.current = enabled;
    if (!enabled || same(value, saved.current)) return;
    setState((s) => (s === 'saving' ? s : 'waiting'));
    timer.current = setTimeout(() => void flush(), delay);
    return () => clearTimeout(timer.current);
  }, [value, enabled, delay, flush, same]);

  useEffect(() => {
    if (state === 'saved') return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state]);

  // Leaving the page inside the app: send what is still waiting.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (allowed.current && !running.current && !same(latest.current, saved.current)) {
        void send(latest.current, new AbortController().signal).catch(() => undefined);
      }
    },
    [same, send],
  );

  return { state, savedAt, /** Saves now; also the retry. */ saveNow: () => void flush() };
}
