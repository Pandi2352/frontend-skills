import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarChart, DonutChart, LineChart, RankChart, type ChartRow } from './index';
import { linePath, niceTicks } from './scale';

const data: ChartRow[] = [
  { label: 'Jan', values: { a: 10, b: 5 } },
  { label: 'Feb', values: { a: null, b: 8 } },
  { label: 'Mar', values: { a: 30, b: -4 } },
];
const series = [{ key: 'a', label: 'Online' }, { key: 'b', label: 'Shop' }];

describe('scale', () => {
  it('makes round steps around the values', () => {
    expect(niceTicks([3, 87])).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks([-4, 30])[0]).toBeLessThan(-3);
    expect(niceTicks([0, 0]).at(-1)).toBeGreaterThan(0);
    expect(niceTicks([]).at(-1)).toBe(1);
    expect(niceTicks([0.1, 0.3])).not.toContain(0.30000000000000004);
  });
  it('leaves a gap for missing values', () => {
    expect(linePath([[0, 0], null, [2, 2], [3, 3]])).toBe('M0.0,0.0M2.0,2.0L3.0,3.0');
  });
});

describe('charts', () => {
  // jsdom has no layout.
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      constructor(private run: (entries: unknown[]) => void) {}
      observe() {
        this.run([{ contentRect: { width: 600 } }]);
      }
      disconnect() {}
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads the values with the keyboard', async () => {
    const user = userEvent.setup();
    render(<LineChart title="Sales" data={data} series={series} />);
    const chart = screen.getByRole('group', { name: 'Sales' });
    chart.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('Jan: Online 10, Shop 5');
    await user.keyboard('{End}{ArrowLeft}');
    expect(screen.getByRole('status')).toHaveTextContent('Feb: Online No data, Shop 8');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('has a legend and a table with the same values', async () => {
    const user = userEvent.setup();
    render(<BarChart stacked title="Sales" labelHeading="Month" data={data} series={series} formatValue={(n) => `$${n}`} />);
    expect(screen.getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Online', 'Shop']);
    await user.click(screen.getByRole('button', { name: 'Show as table' }));
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Jan$10$5');
    expect(rows[3]).toHaveTextContent('Mar$30$-4');
  });

  it('keeps the color of a series when another is removed', () => {
    const colored = [{ key: 'a', label: 'Online', color: 1 as const }, { key: 'b', label: 'Shop', color: 2 as const }];
    const { container, rerender } = render(<LineChart title="Sales" data={data} series={colored} />);
    expect(container.querySelector('.stroke-chart-2')).not.toBeNull();
    rerender(<LineChart title="Sales" data={data} series={colored.slice(1)} />);
    expect(container.querySelector('.stroke-chart-2')).not.toBeNull();
    expect(container.querySelector('.stroke-chart-1')).toBeNull();
  });

  it('shows empty and error', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<LineChart title="Sales" data={[]} series={series} />);
    expect(screen.getByText('No data for this period')).toBeVisible();
    rerender(<LineChart title="Sales" data={undefined} series={series} error="Offline" onRetry={onRetry} />);
    await userEvent.click(within(screen.getByRole('alert')).getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('groups small parts and sorts ranks', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `${i}`, label: `Part ${i}`, value: i + 1 }));
    const { unmount } = render(<DonutChart title="Share" data={many} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Other')).toBeVisible();
    expect(screen.getByRole('img', { name: /Share\. Part 8 20%/ })).toBeVisible();
    unmount();
    render(<RankChart title="Top" data={many} />);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Part 89');
  });
});
