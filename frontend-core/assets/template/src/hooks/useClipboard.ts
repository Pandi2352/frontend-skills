import { useEffect, useRef, useState } from 'react';

/** `state` goes back to idle after a moment. */
export function useClipboard(resetAfter = 2000) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    clearTimeout(timer.current);
    let ok = true;
    try {
      // Missing on pages without https.
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    setState(ok ? 'copied' : 'failed');
    timer.current = setTimeout(() => setState('idle'), resetAfter);
    return ok;
  };
  return { copy, state };
}
