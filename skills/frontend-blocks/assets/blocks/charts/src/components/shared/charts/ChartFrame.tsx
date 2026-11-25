import { ChartNoAxesColumn, Table } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { appConfig } from '@/config/app.config';
import { cn } from '@/lib/cn';

/** Fixed per series: filtering must not change the color of the others. */
export type ChartColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface ChartSeries {
  key: string;
  label: string;
  color?: ChartColor;
}
export interface ChartRow {
  label: string;
  /** null: no value, which is not the same as 0. */
  values: Record<string, number | null | undefined>;
}

export const chartText = {
  table: 'Show as table',
  chart: 'Show as chart',
  empty: 'No data for this period',
  noValue: 'No data',
  other: 'Other',
  total: 'Total',
  hint: 'Use the arrow keys to read the values.',
};

export const fills = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5', 'fill-chart-6', 'fill-chart-7', 'fill-chart-8'];
export const strokes = ['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4', 'stroke-chart-5', 'stroke-chart-6', 'stroke-chart-7', 'stroke-chart-8'];
const swatches = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6', 'bg-chart-7', 'bg-chart-8'];
export const slot = (series: ChartSeries, index: number) => (series.color ?? Math.min(index + 1, 8)) - 1;

const full = new Intl.NumberFormat(appConfig.locale, { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat(appConfig.locale, { notation: 'compact', maximumFractionDigits: 1 });
export const formatFull = (n: number) => full.format(n);
/** Numbers beside the axis, all in the same style. */
export const axisFormat = (ticks: number[]) =>
  ticks.some((t) => Math.abs(t) >= 10_000) ? (n: number) => compact.format(n) : formatFull;

/** The width of an element, also after it changes. */
export function useWidth() {
  const [element, ref] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [ref, width] as const;
}

/** Which position is being read, by pointer or keyboard. */
export function useReading(count: number, toIndex: (event: PointerEvent<SVGSVGElement>) => number) {
  const [chosen, setChosen] = useState<number | null>(null);
  const reading = chosen === null || count === 0 ? null : Math.min(Math.max(chosen, 0), count - 1);
  const choose = (index: number) => index !== chosen && setChosen(index);
  return {
    reading,
    clear: () => setChosen(null),
    handlers: {
      onPointerMove: (event: PointerEvent<SVGSVGElement>) => choose(toIndex(event)),
      onPointerDown: (event: PointerEvent<SVGSVGElement>) => choose(toIndex(event)),
      onPointerLeave: () => setChosen(null),
      onBlur: () => setChosen(null),
      onKeyDown: (event: KeyboardEvent) => {
        const moves: Record<string, number> = {
          ArrowRight: (reading ?? -1) + 1,
          ArrowLeft: (reading ?? count) - 1,
          Home: 0,
          End: count - 1,
        };
        const next = moves[event.key];
        if (event.key === 'Escape' && reading !== null) {
          event.stopPropagation();
          setChosen(null);
        }
        if (next === undefined) return;
        event.preventDefault();
        choose(Math.min(Math.max(next, 0), count - 1));
      },
    },
  };
}

export interface TooltipLine {
  key: string;
  label: string;
  value: string;
  color: number;
}

/** Beside the point being read; stays inside the chart. */
export function ChartTooltip({ x, width, title, lines }: { x: number; width: number; title: string; lines: TooltipLine[] }) {
  const onEnd = x > width / 2;
  return (
    <div
      aria-hidden
      style={onEnd ? { right: width - x + 12 } : { left: x + 12 }}
      className="pointer-events-none absolute top-2 z-(--z-sticky) max-w-56 rounded-md border border-line bg-surface px-3 py-2 text-xs"
    >
      <p className="truncate pb-1 text-muted">{title}</p>
      {lines.map((line) => (
        <p key={line.key} className="flex items-center gap-2">
          <span className={cn('h-0.5 w-3 shrink-0', swatches[line.color])} />
          <span className="font-semibold tabular-nums">{line.value}</span>
          <span className="truncate text-muted">{line.label}</span>
        </p>
      ))}
    </div>
  );
}

export interface ChartBaseProps {
  title: string;
  description?: string;
  /** Beside the title. Filters for several charts belong above them all. */
  actions?: ReactNode;
  isLoading?: boolean;
  /** Refresh: the old chart stays, dimmed. */
  isFetching?: boolean;
  error?: string | undefined;
  onRetry?: () => void;
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

interface ChartFrameProps extends ChartBaseProps {
  legend?: { key: string; label: string; color: number; value?: string }[];
  table: { head: string[]; rows: string[][] };
  /** Content may be taller, e.g. a legend below on phones. */
  grow?: boolean;
  children: ReactNode;
}

/** Title, legend, table view, loading, error and empty state of every chart. */
export function ChartFrame(props: ChartFrameProps) {
  const { title, description, actions, isLoading, isFetching, error, onRetry, height = 240, legend, table, grow, children, className } = props;
  const [asTable, setAsTable] = useState(false);
  const hasData = table.rows.length > 0;

  let body: ReactNode;
  if (error && !hasData) body = <ErrorState message={error} onRetry={onRetry} />;
  else if (isLoading && !hasData) body = <Skeleton className="h-full" />;
  else if (!hasData) body = <EmptyState icon={ChartNoAxesColumn} title={chartText.empty} />;
  else if (asTable) {
    body = (
      <div
        role="region"
        aria-label={title}
        // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- scroll areas must be reachable by keyboard
        tabIndex={0}
        className="h-full overflow-auto focus-visible:outline-2 focus-visible:outline-focus"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="sticky top-0 bg-subtle">
            <tr>
              {table.head.map((h, i) => (
                <th key={h} scope="col" className={cn('px-3 py-2 font-medium', i ? 'text-end' : 'text-start')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map(([first, ...cells]) => (
              <tr key={first} className="border-t border-line">
                <th scope="row" className="px-3 py-2 text-start font-normal">{first}</th>
                {cells.map((cell, i) => (
                  <td key={table.head[i + 1]} className="px-3 py-2 text-end tabular-nums">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else body = children;

  return (
    <Card
      title={title}
      {...(description ? { description } : {})}
      {...(className ? { className } : {})}
      actions={
        <>
          {actions}
          {hasData && (
            <IconButton size="sm" icon={asTable ? ChartNoAxesColumn : Table} label={asTable ? chartText.chart : chartText.table} onClick={() => setAsTable(!asTable)} />
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {legend && legend.length > 1 && hasData && !asTable && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {legend.map((l) => (
              <li key={l.key} className="flex items-center gap-2">
                <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', swatches[l.color])} />
                {l.label}
                {l.value && <span className="font-medium tabular-nums">{l.value}</span>}
              </li>
            ))}
          </ul>
        )}
        <div
          aria-busy={isLoading || isFetching || undefined}
          style={grow && !asTable ? { minHeight: height } : { height }}
          className={cn('relative transition-opacity duration-150', isFetching && 'opacity-60')}
        >
          {body}
        </div>
        {error && hasData && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </Card>
  );
}
