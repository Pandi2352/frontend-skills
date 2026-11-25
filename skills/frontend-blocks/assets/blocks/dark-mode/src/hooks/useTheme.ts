import { useEffect, useSyncExternalStore } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type ThemeChoice = 'light' | 'dark' | 'system';
const KEY = 'theme';

const query = () => window.matchMedia('(prefers-color-scheme: dark)');
const subscribe = (run: () => void) => {
  const media = query();
  media.addEventListener('change', run);
  return () => media.removeEventListener('change', run);
};

/** `choice` is what the person picked; `theme` is what is shown. */
export function useTheme() {
  const [stored, setChoice] = useLocalStorage(KEY, 'system');
  const choice: ThemeChoice = stored === 'light' || stored === 'dark' ? stored : 'system';
  const systemDark = useSyncExternalStore(subscribe, () => query().matches);
  const theme: 'light' | 'dark' = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
  return { choice, theme, setChoice: (next: ThemeChoice) => setChoice(next) };
}

/** Call once, in App. The small script in index.html sets it before the first paint. */
export function useApplyTheme() {
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}
