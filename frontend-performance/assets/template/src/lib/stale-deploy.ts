import type { createBrowserRouter } from 'react-router';
import { isPreloading } from './preload-routes';

const KEY = 'stale-deploy';

/** False when this path was already reloaded a moment ago, so it can never loop. */
function mayReload(path: string) {
  try {
    const [last, time] = (sessionStorage.getItem(KEY) ?? '').split('|');
    if (last === path && Date.now() - Number(time) < 30_000) return false;
    sessionStorage.setItem(KEY, `${path}|${Date.now()}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * After a new release, an open tab asks for files that no longer exist.
 * Opening another page: goes there with a full load, which gets the new files.
 * Anywhere else (a form may be half filled): only calls `onStale`, so you can
 * offer a reload. Call once in main.tsx; returns a cleanup.
 */
export function recoverFromStaleDeploy(
  router: Pick<ReturnType<typeof createBrowserRouter>, 'state' | 'createHref'>,
  onStale: () => void,
  go: (href: string) => void = (href) => location.assign(href),
) {
  const onError = () => {
    const target = router.state.navigation.location;
    if (target) {
      const href = router.createHref(target);
      if (mayReload(href)) go(href);
      return;
    }
    if (!isPreloading()) onStale();
  };
  window.addEventListener('vite:preloadError', onError);
  return () => window.removeEventListener('vite:preloadError', onError);
}
