export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = bytes < 1 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  const size = bytes / 1024 ** power;
  return `${size >= 10 || Number.isInteger(size) ? Math.round(size) : size.toFixed(1)} ${units[power]}`;
}
