import { useState } from 'react';
import { cn } from '@/lib/cn';
import { ChartFrame, chartText, fills, formatFull, strokes, type ChartBaseProps, type ChartColor } from './ChartFrame';
import { linePath, ringPath } from './scale';

export interface ChartPart {
  id: string;
  label: string;
  value: number;
  color?: ChartColor;
}

interface PartsProps extends ChartBaseProps {
  data: readonly ChartPart[] | undefined;
  labelHeading?: string;
  valueHeading?: string;
}

const percent = (value: number, total: number) => `${total ? Math.round((value / total) * 100) : 0}%`;

/** Shares of a whole. Small parts after the fifth become "Other". Values below zero are left out. */
export function DonutChart(props: PartsProps) {
  const { title, data, height = 220, formatValue = formatFull, labelHeading = '', valueHeading = chartText.total } = props;
  const [chosen, setChosen] = useState<string | null>(null);
  const all = (data ?? []).filter((p) => p.value > 0);
  const sorted = [...all].sort((a, b) => b.value - a.value);
  const shown = sorted.length > 6 ? sorted.slice(0, 5) : sorted;
  const rest = sorted.slice(shown.length).reduce((sum, p) => sum + p.value, 0);
  // Colors belong to the part, so they follow the given order, not the size.
  const parts = [
    ...shown.map((p) => ({ ...p, slot: (p.color ?? Math.min(all.indexOf(p) + 1, 8)) - 1 })),
    ...(rest ? [{ id: ' other', label: chartText.other, value: rest, slot: -1 }] : []),
  ];
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const ends = parts.map((_, i) => parts.slice(0, i + 1).reduce((sum, p) => sum + p.value, 0) / (total || 1));
  const focus = parts.find((p) => p.id === chosen);

  return (
    <ChartFrame
      {...props}
      height={height}
      grow
      table={{ head: [labelHeading, valueHeading, '%'], rows: sorted.map((p) => [p.label, formatValue(p.value), percent(p.value, total)]) }}
    >
      <div className="flex min-h-full flex-wrap items-center justify-center gap-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 160" role="img" aria-label={`${title}. ${parts.map((p) => `${p.label} ${percent(p.value, total)}`).join(', ')}`} className="size-40">
            {parts.map((p, i) => (
              <path
                key={p.id}
                d={ringPath(80, 78, 52, ends[i - 1] ?? 0, ends[i] ?? 1)}
                strokeWidth={parts.length > 1 ? 2 : 0}
                onPointerEnter={() => setChosen(p.id)}
                onPointerLeave={() => setChosen(null)}
                className={cn('stroke-surface transition-opacity duration-150', p.slot < 0 ? 'fill-control-line' : fills[p.slot], focus && focus.id !== p.id && 'opacity-40')}
              />
            ))}
          </svg>
          <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="max-w-full truncate font-semibold tabular-nums">{formatValue(focus?.value ?? total)}</span>
            <span className="max-w-full truncate text-xs text-muted">{focus?.label ?? valueHeading}</span>
          </div>
        </div>
        <ul className="min-w-36 text-sm">
          {parts.map((p) => (
            <li
              key={p.id}
              onPointerEnter={() => setChosen(p.id)}
              onPointerLeave={() => setChosen(null)}
              className={cn('flex items-center gap-2 rounded-md px-2 py-1', focus?.id === p.id && 'bg-subtle')}
            >
              <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 shrink-0"><circle cx="5" cy="5" r="5" className={p.slot < 0 ? 'fill-control-line' : fills[p.slot]} /></svg>
              <span className="min-w-0 flex-1 truncate">{p.label}</span>
              <span className="font-medium tabular-nums">{percent(p.value, total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}

/** Ranking with long names. One color, because the length carries the value. */
export function RankChart(props: PartsProps & { color?: ChartColor }) {
  const { data, formatValue = formatFull, labelHeading = '', valueHeading = chartText.total, color = 1 } = props;
  const rows = [...(data ?? [])].sort((a, b) => b.value - a.value);
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <ChartFrame
      {...props}
      height={props.height ?? Math.max(120, rows.length * 44)}
      table={{ head: [labelHeading, valueHeading], rows: rows.map((r) => [r.label, formatValue(r.value)]) }}
    >
      <ol className="flex h-full flex-col justify-around overflow-auto">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-1 py-1 text-sm">
            <span className="flex justify-between gap-3">
              <span className="min-w-0 truncate">{r.label}</span>
              <span className="font-medium tabular-nums">{formatValue(r.value)}</span>
            </span>
            <svg aria-hidden preserveAspectRatio="none" viewBox="0 0 100 8" className="h-2 w-full overflow-visible rtl:-scale-x-100">
              <rect width={max > 0 ? Math.max(0.5, (Math.max(0, r.value) / max) * 100) : 0} height="8" className={fills[color - 1]} />
            </svg>
          </li>
        ))}
      </ol>
    </ChartFrame>
  );
}

/** Small trend without axes, for StatCard or a table cell. Say the trend in text too. */
export function Sparkline({ values, label, color = 1, className }: { values: readonly (number | null)[]; label: string; color?: ChartColor; className?: string }) {
  const real = values.filter((v) => v !== null);
  const min = Math.min(...real);
  const span = Math.max(...real) - min || 1;
  const points = values.map((v, i): [number, number] | null =>
    v === null ? null : [2 + (i / Math.max(1, values.length - 1)) * 96, 22 - ((v - min) / span) * 20],
  );
  return (
    <svg role="img" aria-label={label} viewBox="0 0 100 24" preserveAspectRatio="none" className={cn('h-6 w-full', className)}>
      <path d={linePath(points)} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" className={strokes[color - 1]} />
    </svg>
  );
}
