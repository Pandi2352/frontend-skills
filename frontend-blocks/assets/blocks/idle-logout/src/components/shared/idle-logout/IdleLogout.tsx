import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useStableCallback } from '@/hooks/useStableCallback';

export const idleText = {
  title: 'Are you still there?',
  message: (seconds: number) => `You will be signed out in ${seconds} seconds.`,
  stay: 'Stay signed in',
  leave: 'Sign out',
};

export interface IdleLogoutProps {
  /** Minutes without activity in any tab. */
  minutes: number;
  /** Seconds to answer before it happens. */
  warnSeconds?: number;
  onLogout: () => void;
  /** Called when the person stays, e.g. to refresh the session. */
  onStay?: () => void;
}

const KEY = 'last-activity';
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'visibilitychange'] as const;

/** Render it only for signed-in people. Activity in one tab counts for all. */
export function IdleLogout({ minutes, warnSeconds = 60, onLogout, onStay }: IdleLogoutProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const last = useRef(0);
  const written = useRef(0);
  const warning = secondsLeft !== null;
  const logout = useStableCallback(onLogout);

  const touch = useStableCallback((force: boolean) => {
    const now = Date.now();
    // While the question is open only its button counts.
    if (warning && !force) return;
    // A computer that slept past the limit must not be woken by the first move.
    if (!force && now - last.current > minutes * 60_000) return;
    last.current = now;
    if (!force && now - written.current < 5000) return;
    written.current = now;
    try {
      localStorage.setItem(KEY, String(now));
    } catch {
      // Then each tab counts alone.
    }
  });

  const check = useStableCallback(() => {
    let shared = 0;
    try {
      shared = Number(localStorage.getItem(KEY)) || 0;
    } catch {
      // Then each tab counts alone.
    }
    last.current = Math.max(last.current, Math.min(shared, Date.now()));
    const left = Math.ceil((last.current + minutes * 60_000 - Date.now()) / 1000);
    if (left <= 0) {
      setSecondsLeft(null);
      logout();
    } else setSecondsLeft(left <= warnSeconds ? left : null);
  });

  useEffect(() => {
    touch(true);
    const stop = new AbortController();
    for (const name of EVENTS) {
      document.addEventListener(name, () => touch(false), { passive: true, capture: true, signal: stop.signal });
    }
    // Timers stop while a computer sleeps; the clock does not.
    const timer = setInterval(check, 1000);
    return () => {
      stop.abort();
      clearInterval(timer);
    };
  }, [touch, check]);

  const stay = () => {
    touch(true);
    setSecondsLeft(null);
    onStay?.();
  };

  return (
    <Modal
      open={warning}
      onClose={stay}
      dismissible={false}
      hideClose
      role="alertdialog"
      size="sm"
      title={idleText.title}
      description={idleText.message(secondsLeft ?? 0)}
      footer={
        <>
          <Button variant="outline" onClick={logout}>{idleText.leave}</Button>
          <Button onClick={stay}>{idleText.stay}</Button>
        </>
      }
    />
  );
}
