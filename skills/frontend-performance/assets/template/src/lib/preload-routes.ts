import { matchRoutes, type RouteObject } from 'react-router';

let running = 0;
/** True while a page is loading in the background, before anyone asked for it. */
export const isPreloading = () => running > 0;

const done = new Set<unknown>();

/** Downloads the code of the page behind a path. Safe to call often. */
export async function preloadPath(routes: RouteObject[], path: string, basename = '/') {
  const jobs = (matchRoutes(routes, path, basename) ?? []).flatMap(({ route }) => {
    const { lazy } = route;
    const loads = typeof lazy === 'function' ? [lazy] : Object.values(lazy ?? {});
    return loads.filter((load): load is () => Promise<unknown> => typeof load === 'function');
  });
  await Promise.all(
    jobs
      .filter((load) => !done.has(load))
      .map(async (load) => {
        done.add(load);
        running++;
        try {
          await load();
        } catch {
          // The real visit tries again and shows the problem.
          done.delete(load);
        } finally {
          running--;
        }
      }),
  );
}

/** Respects "save data" and very slow connections. */
function isSlow() {
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  return !!connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');
}

/**
 * Starts loading a page when someone points at, focuses or touches its link.
 * Works for every link in the app. Call once in main.tsx; returns a cleanup.
 */
export function preloadOnIntent(routes: RouteObject[], basename = '/') {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const start = (event: Event) => {
    clearTimeout(timer);
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link?.href || link.target === '_blank' || link.hasAttribute('download') || isSlow()) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    // Wait a moment, so moving across a menu does not load every page.
    const wait = event.type === 'pointerover' ? 60 : 0;
    timer = setTimeout(() => void preloadPath(routes, url.pathname, basename), wait);
  };

  const events = ['pointerover', 'focusin', 'touchstart'] as const;
  for (const name of events) document.addEventListener(name, start, { passive: true });
  return () => {
    clearTimeout(timer);
    for (const name of events) document.removeEventListener(name, start);
  };
}
