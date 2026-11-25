import { appConfig } from '@/config/app.config';

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3600], ['minute', 60],
];

/** "5 minutes ago", in the language of the app. */
export function formatTimeAgo(iso: string, now = Date.now()) {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  if (!Number.isFinite(seconds)) return '';
  const format = new Intl.RelativeTimeFormat(appConfig.locale, { numeric: 'auto' });
  const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? ['second', 1];
  return unit === 'second' ? format.format(0, 'second') : format.format(Math.round(seconds / size), unit);
}
