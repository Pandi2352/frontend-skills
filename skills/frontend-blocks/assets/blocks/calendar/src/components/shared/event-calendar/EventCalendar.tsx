import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Button, IconButton } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/fields/choice/RadioGroup';
import { PopupPanel, usePopup } from '@/components/ui/fields/base';
import { TopProgressBar } from '@/components/ui/loader';
import { appConfig } from '@/config/app.config';
import { cn } from '@/lib/cn';
import { addDays, addMonths, daysInMonth, formatIso, parts, startOfMonth, todayIso, weekday, type IsoDate } from '@/utils/date';

const tones = {
  primary: 'border-primary bg-primary-subtle text-primary',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
  neutral: 'border-control-line text-foreground',
};

export interface CalendarEvent {
  id: string;
  title: string;
  start: IsoDate;
  /** Last day, included. Default: one day. */
  end?: IsoDate;
  /** Already formatted, e.g. "10:30". Sorts as text, so use 24 hours or two digits. */
  time?: string;
  tone?: keyof typeof tones;
}

export interface EventCalendarProps {
  label: string;
  events: readonly CalendarEvent[] | undefined;
  /** First day of the shown month. */
  month?: IsoDate;
  defaultMonth?: IsoDate;
  /** Load events for this range; it includes the days around the month. */
  onMonthChange?: (month: IsoDate, range: { from: IsoDate; to: IsoDate }) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  /** Makes days clickable, e.g. to create an event. */
  onSelectDay?: (day: IsoDate) => void;
  view?: 'month' | 'agenda';
  isLoading?: boolean;
  error?: string | undefined;
  onRetry?: () => void;
  toolbar?: ReactNode;
  className?: string;
}

export const calendarText = {
  today: 'Today',
  previous: 'Previous month',
  next: 'Next month',
  view: 'View',
  month: 'Month',
  agenda: 'Agenda',
  more: (n: number) => `${n} more`,
  add: 'Add event',
  events: (n: number) => (n === 1 ? '1 event' : `${n} events`),
  empty: 'No events in this month',
  allDay: 'All day',
};

/** The days the month view shows, in whole weeks. */
export function monthRange(month: IsoDate) {
  const first = startOfMonth(month);
  const { year, month: m } = parts(first);
  const before = (weekday(first) - appConfig.weekStartsOn + 7) % 7;
  const weeks = Math.ceil((before + daysInMonth(year, m)) / 7);
  const from = addDays(first, -before);
  return { from, to: addDays(from, weeks * 7 - 1), weeks };
}

const onDay = (events: readonly CalendarEvent[], day: IsoDate) =>
  events
    .filter((e) => e.start <= day && (e.end ?? e.start) >= day)
    .sort((a, b) => a.start.localeCompare(b.start) || (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title));

function EventButton({ event, day, onOpen }: { event: CalendarEvent; day: IsoDate; onOpen: (event: CalendarEvent) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={cn(
        'flex min-h-6 w-full items-center gap-1 rounded-md border px-1.5 text-start text-xs hover:underline focus-visible:outline-2 focus-visible:outline-focus',
        tones[event.tone ?? 'primary'],
      )}
    >
      {event.time && event.start === day && <span className="shrink-0 tabular-nums">{event.time}</span>}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

function More({ events, day, onOpen }: { events: CalendarEvent[]; day: IsoDate; onOpen: (event: CalendarEvent) => void }) {
  const [open, setOpen] = useState(false);
  const popup = usePopup({ open, onOpenChange: setOpen });
  const { setReference, getReferenceProps } = popup;
  const title = formatIso(day, appConfig.locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <>
      <button
        type="button"
        ref={setReference}
        aria-expanded={open}
        className="min-h-6 rounded-md px-1.5 text-start text-xs text-muted hover:underline focus-visible:outline-2 focus-visible:outline-focus"
        {...getReferenceProps({ onClick: () => setOpen(!open) })}
      >
        {calendarText.more(events.length)}
      </button>
      <PopupPanel popup={popup} role="dialog" aria-label={title} className="w-64 p-3">
        <p className="pb-2 text-sm font-medium">{title}</p>
        <div className="flex flex-col gap-1">
          {events.map((e) => (
            <EventButton key={e.id} event={e} day={day} onOpen={(event) => { setOpen(false); onOpen(event); }} />
          ))}
        </div>
      </PopupPanel>
    </>
  );
}

/** Month and agenda. Phones always show the agenda. */
export function EventCalendar(props: EventCalendarProps) {
  const { label, events, onMonthChange, onOpenEvent, onSelectDay, isLoading = false, error, onRetry, toolbar, className } = props;
  const id = useId();
  const grid = useRef<HTMLTableElement>(null);
  const today = todayIso();
  const [own, setOwn] = useState(startOfMonth(props.defaultMonth ?? today));
  const [view, setView] = useState(props.view ?? 'month');
  const month = startOfMonth(props.month ?? own);
  const [active, setActive] = useState<IsoDate>(today);
  const { from, weeks } = monthRange(month);
  const inMonth = (day: IsoDate) => day.slice(0, 7) === month.slice(0, 7);
  // One day of the grid can be reached with Tab; arrow keys move.
  const focusDay = inMonth(active) ? active : month;
  const list = events ?? [];

  const show = (next: IsoDate) => {
    const first = startOfMonth(next);
    const range = monthRange(first);
    setOwn(first);
    onMonthChange?.(first, { from: range.from, to: range.to });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
    const target: Record<string, IsoDate> = {
      ArrowLeft: addDays(focusDay, -rtl),
      ArrowRight: addDays(focusDay, rtl),
      ArrowUp: addDays(focusDay, -7),
      ArrowDown: addDays(focusDay, 7),
      PageUp: addMonths(focusDay, -1),
      PageDown: addMonths(focusDay, 1),
    };
    const next = target[event.key];
    if (!next || !(event.target instanceof HTMLElement) || !event.target.dataset.day) return;
    event.preventDefault();
    setActive(next);
    if (!inMonth(next)) show(next);
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
  };

  const title = formatIso(month, appConfig.locale, { month: 'long', year: 'numeric' });
  const { year, month: m } = parts(month);
  const agenda = Array.from({ length: daysInMonth(year, m) }, (_, i) => addDays(month, i))
    .map((day) => ({ day, events: onDay(list, day) }))
    .filter((d) => d.events.length);
  const dayName = (day: IsoDate) => formatIso(day, appConfig.locale, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section aria-label={label} aria-busy={isLoading || undefined} className={cn('flex flex-col gap-3', className)}>
      <TopProgressBar active={isLoading} />
      <div className="flex flex-wrap items-center gap-2">
        <IconButton variant="outline" icon={ChevronLeft} label={calendarText.previous} onClick={() => show(addMonths(month, -1))} />
        <IconButton variant="outline" icon={ChevronRight} label={calendarText.next} onClick={() => show(addMonths(month, 1))} />
        <Button variant="outline" onClick={() => { setActive(today); show(today); }}>{calendarText.today}</Button>
        <h2 id={`${id}-title`} aria-live="polite" className="text-lg font-semibold">{title}</h2>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {toolbar}
          <RadioGroup
            hideLabel
            variant="segmented"
            label={calendarText.view}
            className="hidden w-52 md:flex"
            value={view}
            onChange={(next) => setView(next as 'month' | 'agenda')}
            options={[{ value: 'month', label: calendarText.month }, { value: 'agenda', label: calendarText.agenda }]}
          />
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={onRetry} />}

      {view === 'month' && (
        <table ref={grid} role="grid" aria-labelledby={`${id}-title`} tabIndex={-1} onKeyDown={onKeyDown} className="hidden w-full table-fixed border-collapse rounded-md bg-surface md:table">
          <thead>
            <tr>
              {Array.from({ length: 7 }, (_, i) => addDays(from, i)).map((day) => (
                <th key={day} scope="col" className="border border-line p-2 text-start text-xs font-medium text-muted">
                  <span aria-hidden>{formatIso(day, appConfig.locale, { weekday: 'short' })}</span>
                  <span className="sr-only">{formatIso(day, appConfig.locale, { weekday: 'long' })}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: weeks }, (_, w) => (
              <tr key={w}>
                {Array.from({ length: 7 }, (_, d) => addDays(from, w * 7 + d)).map((day) => {
                  const dayEvents = onDay(list, day);
                  const shown = dayEvents.length > 3 ? dayEvents.slice(0, 2) : dayEvents;
                  return (
                    <td key={day} className={cn('h-28 border border-line p-1 align-top', !inMonth(day) && 'bg-subtle')}>
                      <div className="flex h-full min-w-0 flex-col gap-1">
                        <button
                          type="button"
                          data-day={day}
                          tabIndex={day === focusDay ? 0 : -1}
                          aria-current={day === today ? 'date' : undefined}
                          aria-label={`${dayName(day)}, ${calendarText.events(dayEvents.length)}${onSelectDay ? `, ${calendarText.add}` : ''}`}
                          onFocus={() => setActive(day)}
                          onClick={() => onSelectDay?.(day)}
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full text-xs focus-visible:outline-2 focus-visible:outline-focus',
                            onSelectDay && 'hover:bg-secondary',
                            day === today ? 'bg-primary font-semibold text-on-primary hover:bg-primary-hover' : !inMonth(day) && 'text-muted',
                          )}
                        >
                          {parts(day).day}
                        </button>
                        {shown.map((e) => <EventButton key={e.id} event={e} day={day} onOpen={onOpenEvent} />)}
                        {shown.length < dayEvents.length && <More events={dayEvents.slice(shown.length)} day={day} onOpen={onOpenEvent} />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={cn('rounded-md border border-line bg-surface', view === 'month' && 'md:hidden')}>
        {agenda.length ? (
          <ol className="divide-y divide-line">
            {agenda.map(({ day, events: dayEvents }) => (
              <li key={day} className="flex flex-col gap-2 p-3 sm:flex-row">
                <h3 className={cn('w-48 shrink-0 text-sm font-medium', day === today && 'text-primary')}>{dayName(day)}</h3>
                <ul className="flex min-w-0 flex-1 flex-col gap-1">
                  {dayEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm">
                      <span className="w-16 shrink-0 text-muted tabular-nums">{e.start === day && e.time ? e.time : calendarText.allDay}</span>
                      <EventButton event={{ ...e, time: '' }} day={day} onOpen={() => onOpenEvent(e)} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title={calendarText.empty} />
        )}
      </div>
    </section>
  );
}
