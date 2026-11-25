import { useEffect, useRef } from 'react';

/** Ctrl+key on Windows and Linux, Cmd+key on Mac. */
export function useKeyboardShortcut(key: string, run: (() => void) | undefined) {
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!latest.current || event.key.toLowerCase() !== key) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      latest.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key]);
}
