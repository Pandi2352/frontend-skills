/** Checked at startup, so a missing value fails early with a clear message. */
function required(name: string, value: unknown): string {
  if (typeof value !== 'string' || !value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL).replace(/\/+$/, ''),
};
