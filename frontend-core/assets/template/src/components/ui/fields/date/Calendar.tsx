import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import {
  addDays, addMonths, formatIso, parts, startOfMonth, toIso, todayIso, weekday, type IsoDate,
} from '@/utils/date';
import { focusRing, frameButtonClass } from '../base';

export interface DateLimits {
  min?: IsoDate;
  max?: IsoDate;
  isDateDisabled?: (date: IsoDate) => boolean;
  locale?: string;
  weekStartsOn?: number;
}

export interface CalendarProps extends DateLimits {
  selected: IsoDate | null;
  /** Highlights every day between the two. */
  range?: { start: IsoDate | null; end: IsoDate | null };
  onSelect: (date: IsoDate) => void;
  months?: 1 | 2;
}

export const isAllowed = (date: IsoDate, limits: DateLimits) =>
  (!limits.min || date >= limits.min) &&
  (!limits.max || date <= limits.max) &&
  !limits.isDateDisabled?.(date);

export function Calendar(props: CalendarProps) {
  const {
    selected, range, onSelect, months = 1, min, max,
    locale = appConfig.locale, weekStartsOn = appConfig.weekStartsOn,
  } = props;
  const [focused, setFocused] = useState<IsoDate>(() => {
    const start = selected ?? range?.start ?? todayIso();
    if (min && start < min) return min;
    if (max && start > max) return max;
    return start;
  });
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const box = useRef<HTMLDivElement>(null);
  // Each increase moves DOM focus to the focused day. Starts when opened.
  const [focusRequest, setFocusRequest] = useState(1);

  useEffect(() => {
    if (focusRequest === 0) return;
    box.current
      ?.querySelector<HTMLButtonElement>('[data-date][tabindex="0"]')
      ?.focus({ preventScroll: true });
  }, [focusRequest]);

  const { year, month } = parts(focused);
  const go = (next: IsoDate, keyboard = false) => {
    if (keyboard) setFocusRequest((n) => n + 1);
    setFocused(min && next < min ? min : max && next > max ? max : next);
  };
  const pageMonths = { days: 1, months: 12, years: 144 }[view];
  const firstYear = year - (year % 12);
  const before = addMonths(startOfMonth(focused), -pageMonths);
  const after = addMonths(startOfMonth(focused), pageMonths);
  const title = {
    // Two months already show their own names.
    days:
      months === 2 ? String(year) : formatIso(focused, locale, { month: 'long', year: 'numeric' }),
    months: String(year),
    years: `${firstYear} – ${firstYear + 11}`,
  }[view];

  const onKeyDown = (event: KeyboardEvent) => {
    const offset = (weekday(focused) - weekStartsOn + 7) % 7;
    const targets: Record<string, IsoDate> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      Home: addDays(focused, -offset),
      End: addDays(focused, 6 - offset),
      PageUp: addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: addMonths(focused, event.shiftKey ? 12 : 1),
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    go(target, true);
  };

  const monthGrid = (first: IsoDate, extra: boolean) => {
    const shift = (weekday(first) - weekStartsOn + 7) % 7;
    const start = addDays(first, -shift);
    const weeks = Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
    ).filter((week) => week.some((d) => d.slice(0, 7) === first.slice(0, 7)));
    const name = formatIso(first, locale, { month: 'long', year: 'numeric' });
    return (
      <div key={first} className={cn(extra && 'hidden md:block')}>
        {months > 1 && <p className="pb-1 text-center text-sm font-medium">{name}</p>}
        <table role="grid" aria-label={name} onKeyDown={onKeyDown}>
          <thead>
            <tr>
              {weeks[0]?.map((d) => (
                <th key={d} scope="col" className="size-9 text-xs font-normal text-muted">
                  <span aria-hidden>{formatIso(d, locale, { weekday: 'short' })}</span>
                  <span className="sr-only">{formatIso(d, locale, { weekday: 'long' })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((d) => {
                  if (d.slice(0, 7) !== first.slice(0, 7)) return <td key={d} />;
                  const isEdge = d === selected || d === range?.start || d === range?.end;
                  const between =
                    !!range?.start && !!range.end && d > range.start && d < range.end;
                  const off = !isAllowed(d, props);
                  return (
                    <td key={d} className={cn('p-0', between && 'bg-primary-subtle')}>
                      <button
                        type="button"
                        data-date={d}
                        tabIndex={d === focused ? 0 : -1}
                        aria-label={formatIso(d, locale, { dateStyle: 'full' })}
                        aria-pressed={isEdge}
                        aria-current={d === todayIso() ? 'date' : undefined}
                        aria-disabled={off || undefined}
                        onClick={() => {
                          if (off) return;
                          setFocused(d);
                          onSelect(d);
                        }}
                        className={cn(
                          'size-9 rounded-md text-sm',
                          focusRing,
                          isEdge ? 'bg-primary text-on-primary' : !off && 'hover:bg-subtle',
                          d === todayIso() && !isEdge && 'font-semibold text-primary underline',
                          off && 'cursor-not-allowed text-muted line-through opacity-50',
                        )}
                      >
                        {Number(d.slice(8))}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tile = (label: string, key: string, current: boolean, off: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      disabled={off}
      aria-pressed={current}
      onClick={onClick}
      className={cn(
        'h-control rounded-md px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        current ? 'bg-primary text-on-primary' : 'hover:bg-subtle',
      )}
    >
      {label}
    </button>
  );
  const outside = (from: string, to: string) => (!!min && to < min) || (!!max && from > max);

  return (
    <div ref={box} className="w-fit p-3">
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          aria-label={fieldText.previous}
          disabled={!!min && addMonths(startOfMonth(focused), 0) <= min}
          onClick={() => go(before)}
          className={frameButtonClass}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-live="polite"
          onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
          className={cn('rounded-md px-2 py-1 text-sm font-medium hover:bg-subtle', focusRing)}
        >
          {title}
        </button>
        <button
          type="button"
          aria-label={fieldText.next}
          disabled={!!max && after > max}
          onClick={() => go(after)}
          className={frameButtonClass}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
      {view === 'days' && (
        <div className="flex gap-6">
          {monthGrid(startOfMonth(focused), false)}
          {months === 2 && monthGrid(addMonths(startOfMonth(focused), 1), true)}
        </div>
      )}
      {view === 'months' && (
        <div className="grid w-64 grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const first = toIso(year, i + 1, 1);
            return tile(
              formatIso(first, locale, { month: 'short' }), first, i + 1 === month,
              outside(first, addDays(addMonths(first, 1), -1)),
              () => {
                go(addMonths(focused, i + 1 - month), true);
                setView('days');
              },
            );
          })}
        </div>
      )}
      {view === 'years' && (
        <div className="grid w-64 grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => firstYear + i).map((y) =>
            tile(String(y), String(y), y === year, outside(toIso(y, 1, 1), toIso(y, 12, 31)), () => {
              go(addMonths(focused, (y - year) * 12));
              setView('months');
            }),
          )}
        </div>
      )}
    </div>
  );
}
