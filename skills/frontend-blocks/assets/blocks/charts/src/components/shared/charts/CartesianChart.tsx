import { Fragment, useId, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import {
  ChartFrame, ChartTooltip, chartText, fills, axisFormat, formatFull, slot, strokes, useReading, useWidth,
  type ChartBaseProps, type ChartRow, type ChartSeries,
} from './ChartFrame';
import { barPath, linePath, niceTicks } from './scale';

export interface CartesianChartProps extends ChartBaseProps {
  /** In the order to show. Time goes from old to new. */
  data: readonly ChartRow[] | undefined;
  series: ChartSeries[];
  /** Heading of the first table column, e.g. "Month". */
  labelHeading?: string;
}

interface InnerProps extends CartesianChartProps {
  kind: 'line' | 'area' | 'bar' | 'stacked';
  fromZero?: boolean;
}

const TOP = 8;
const BOTTOM = 24;
const numbers = (rows: readonly ChartRow[], series: ChartSeries[]) =>
  rows.flatMap((r) => series.map((s) => r.values[s.key])).filter((v): v is number => typeof v === 'number');

/** Axis, grid, marks, reading line and tooltip for line and column charts. */
function Cartesian({ kind, fromZero = true, ...props }: InnerProps) {
  const { title, data, series, height = 240, formatValue = formatFull, labelHeading = '' } = props;
  const rows = data ?? [];
  const id = useId();
  const [ref, width] = useWidth();
  const isBar = kind === 'bar' || kind === 'stacked';

  const sums = rows.flatMap((r) => {
    const values = series.map((s) => r.values[s.key] ?? 0);
    return [values.filter((v) => v > 0).reduce((a, b) => a + b, 0), values.filter((v) => v < 0).reduce((a, b) => a + b, 0)];
  });
  const ticks = niceTicks(kind === 'stacked' ? sums : numbers(rows, series), 4, isBar || kind === 'area' || fromZero);
  const low = ticks[0] ?? 0;
  const high = ticks.at(-1) ?? 1;

  const formatAxis = axisFormat(ticks);
  // Room for the longest number beside the axis.
  const left = Math.max(...ticks.map((t) => formatAxis(t).length)) * 7 + 12;
  const plot = Math.max(0, width - left - 20);
  const tall = height - TOP - BOTTOM;
  const y = (value: number) => TOP + tall - ((value - low) / (high - low)) * tall;
  const band = rows.length ? plot / rows.length : 0;
  const x = (index: number) =>
    isBar || rows.length === 1 ? left + band * (index + 0.5) : left + (plot * index) / (rows.length - 1);

  const { reading, handlers } = useReading(rows.length, (event: PointerEvent<SVGSVGElement>) => {
    const at = event.clientX - event.currentTarget.getBoundingClientRect().left - left;
    return isBar ? Math.floor(at / (band || 1)) : Math.round((at / (plot || 1)) * (rows.length - 1));
  });
  const row = reading === null ? undefined : rows[reading];
  const lines = (r: ChartRow) =>
    series.map((s, i) => {
      const value = r.values[s.key];
      return { key: s.key, label: s.label, color: slot(s, i), value: typeof value === 'number' ? formatValue(value) : chartText.noValue };
    });

  // Not every label fits; keep a regular rhythm.
  const longest = Math.max(0, ...rows.map((r) => r.label.length)) * 7 + 16;
  const every = Math.max(1, Math.ceil((rows.length * longest) / (plot || 1)));

  const barSpace = Math.max(1, Math.min(band * 0.7, kind === 'bar' ? series.length * 26 : 24));
  const barWidth = kind === 'bar' ? Math.max(1, barSpace / series.length - 2) : barSpace;

  return (
    <ChartFrame
      {...props}
      legend={series.map((s, i) => ({ key: s.key, label: s.label, color: slot(s, i) }))}
      table={{ head: [labelHeading, ...series.map((s) => s.label)], rows: rows.map((r) => [r.label, ...lines(r).map((l) => l.value)]) }}
    >
      <div ref={ref} dir="ltr" className="absolute inset-0">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="group"
            aria-roledescription="chart"
            aria-label={title}
            aria-describedby={`${id}-hint`}
            tabIndex={0}
            {...handlers}
            className="block touch-pan-y rounded-md focus-visible:outline-2 focus-visible:outline-focus"
          >
            {ticks.map((t) => (
              <g key={t} aria-hidden>
                <line x1={left} x2={left + plot} y1={y(t)} y2={y(t)} className={t === 0 ? 'stroke-control-line' : 'stroke-line'} />
                <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-xs tabular-nums">{formatAxis(t)}</text>
              </g>
            ))}
            {rows.map((r, i) =>
              i % every === 0 ? (
                <text key={r.label} aria-hidden x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-xs">{r.label}</text>
              ) : null,
            )}
            {reading !== null &&
              (isBar ? (
                <rect x={left + band * reading} y={TOP} width={band} height={tall} className="fill-subtle" />
              ) : (
                <line x1={x(reading)} x2={x(reading)} y1={TOP} y2={TOP + tall} className="stroke-control-line" />
              ))}

            {isBar
              ? rows.map((r, i) => {
                  let up = 0;
                  let down = 0;
                  return (
                    <g key={r.label} aria-hidden>
                      {series.map((s, n) => {
                        const value = r.values[s.key];
                        if (typeof value !== 'number' || value === 0) return null;
                        const start = kind === 'bar' ? 0 : value > 0 ? up : down;
                        const end = start + value;
                        if (kind === 'stacked') {
                          if (value > 0) up = end;
                          else down = end;
                        }
                        const last = kind === 'bar' || !series.slice(n + 1).some((later) => (r.values[later.key] ?? 0) * value > 0);
                        const from = Math.min(y(start), y(end));
                        // The gap between stacked parts shows the surface.
                        const size = Math.max(1, Math.abs(y(start) - y(end)) - (kind === 'stacked' && start !== 0 ? 2 : 0));
                        const at = kind === 'bar' ? x(i) - barSpace / 2 + n * (barWidth + 2) + 1 : x(i) - barWidth / 2;
                        return (
                          <path
                            key={s.key}
                            d={barPath(at, value > 0 || start === 0 ? from : from + 2, barWidth, size, last ? (value > 0 ? 'top' : 'bottom') : 'none')}
                            className={fills[slot(s, n)]}
                          />
                        );
                      })}
                    </g>
                  );
                })
              : series.map((s, n) => {
                  const points = rows.map((r, i): [number, number] | null => {
                    const value = r.values[s.key];
                    return typeof value === 'number' ? [x(i), y(value)] : null;
                  });
                  const path = linePath(points);
                  const only = points.filter((p) => p !== null);
                  return (
                    <Fragment key={s.key}>
                      {kind === 'area' && only.length > 1 && only.length === points.length && (
                        <path aria-hidden d={`${path}L${only.at(-1)?.[0]},${y(0)}L${only[0]?.[0]},${y(0)}Z`} className={cn(fills[slot(s, n)], 'opacity-10')} />
                      )}
                      <path aria-hidden d={path} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className={strokes[slot(s, n)]} />
                      {points.map((p, i) => {
                        if (!p) return null;
                        // A single value between gaps would be an invisible line.
                        const alone = !points[i - 1] && !points[i + 1];
                        if (i !== reading && !alone && i !== points.length - 1) return null;
                        return <circle key={rows[i]?.label} aria-hidden cx={p[0]} cy={p[1]} r={4} strokeWidth={2} className={cn(fills[slot(s, n)], 'stroke-surface')} />;
                      })}
                    </Fragment>
                  );
                })}
          </svg>
        )}
        {row && reading !== null && <ChartTooltip x={x(reading)} width={width} title={row.label} lines={lines(row)} />}
        <span id={`${id}-hint`} className="sr-only">{chartText.hint}</span>
        <span role="status" className="sr-only">
          {row ? `${row.label}: ${lines(row).map((l) => `${l.label} ${l.value}`).join(', ')}` : ''}
        </span>
      </div>
    </ChartFrame>
  );
}

/** Change over time. Up to four series; more belong in separate small charts. */
export function LineChart({ area, fromZero, ...props }: CartesianChartProps & { area?: boolean; fromZero?: boolean }) {
  return <Cartesian {...props} kind={area ? 'area' : 'line'} {...(fromZero === undefined ? {} : { fromZero })} />;
}

/** Comparing amounts. `stacked` when the parts make a whole. */
export function BarChart({ stacked, ...props }: CartesianChartProps & { stacked?: boolean }) {
  return <Cartesian {...props} kind={stacked ? 'stacked' : 'bar'} />;
}
