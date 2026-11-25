/** Only paths inside this app, so a crafted link cannot redirect elsewhere. */
export function safePath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  try {
    const url = new URL(value, 'https://app.invalid');
    if (url.origin !== 'https://app.invalid') return fallback;
    const path = url.pathname + url.search + url.hash;
    return path.startsWith('//') ? fallback : path;
  } catch {
    return fallback;
  }
}
