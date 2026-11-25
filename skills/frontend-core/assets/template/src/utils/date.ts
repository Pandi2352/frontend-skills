// Dates are ISO strings (YYYY-MM-DD) and calculated in UTC, so a date never
// moves to the previous or next day because of a timezone.
export type IsoDate = string;

const pad = (n: number, size = 2) => String(n).padStart(size, '0');

export const toIso = (year: number, month: number, day: number): IsoDate =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

export function parts(iso: IsoDate) {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return { year, month, day };
}

const utc = (iso: IsoDate) => {
  const { year, month, day } = parts(iso);
  return new Date(Date.UTC(year, month - 1, day));
};
const fromUtc = (d: Date) => toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());

export function isValidIso(iso: string | null | undefined): iso is IsoDate {
  return !!iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) && fromUtc(utc(iso)) === iso;
}

export function todayIso(): IsoDate {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const { year, month, day } = parts(iso);
  const total = year * 12 + (month - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return toIso(y, m, Math.min(day, daysInMonth(y, m)));
}

export const weekday = (iso: IsoDate) => utc(iso).getUTCDay();
export const startOfMonth = (iso: IsoDate) => `${iso.slice(0, 7)}-01`;

export const formatIso = (iso: IsoDate, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(utc(iso));

type Part = 'day' | 'month' | 'year';

function typedLayout(locale: string) {
  const found = new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn',
  }).formatToParts(new Date(Date.UTC(2026, 11, 31)));
  const order = found
    .map((p) => p.type)
    .filter((t): t is Part => t === 'day' || t === 'month' || t === 'year');
  const separator = found.find((p) => p.type === 'literal')?.value.trim() || '/';
  return { order, separator };
}

/** 2026-12-31 becomes 12/31/2026 or 31/12/2026, following the locale. */
export function formatTyped(iso: IsoDate, locale: string) {
  const { order, separator } = typedLayout(locale);
  const p = parts(iso);
  const text = { year: pad(p.year, 4), month: pad(p.month), day: pad(p.day) };
  return order.map((k) => text[k]).join(separator);
}

export function typedPlaceholder(locale: string) {
  const { order, separator } = typedLayout(locale);
  return order.map((k) => ({ year: 'YYYY', month: 'MM', day: 'DD' })[k]).join(separator);
}

/** Reads what a person typed. Returns null if it is not a real date. */
export function parseTyped(text: string, locale: string): IsoDate | null {
  const numbers = text.match(/\d+/g);
  if (numbers?.length !== 3) return null;
  const isoOrder: Part[] = ['year', 'month', 'day'];
  const order = numbers[0]?.length === 4 ? isoOrder : typedLayout(locale).order;
  const value = { year: 0, month: 0, day: 0 };
  order.forEach((k, i) => {
    value[k] = Number(numbers[i]);
  });
  if (value.year < 100) value.year += value.year < 50 ? 2000 : 1900;
  const iso = toIso(value.year, value.month, value.day);
  return isValidIso(iso) ? iso : null;
}
