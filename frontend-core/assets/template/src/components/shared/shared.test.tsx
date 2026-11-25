import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { LoadingOverlay, Progress } from '@/components/ui/loader';
import { Pagination, pageList } from '@/components/ui/pagination';
import { toCsv } from '@/utils/csv';
import { DataTable, useTableState, type Column, type DataTableProps } from './data-table';
import { processRows } from './data-table/process';
import { defaultTableState } from './data-table/types';
import { ErrorBoundary } from './error-boundary';
import { AsyncView } from './states';

vi.setConfig({ testTimeout: 30_000 });

interface Row {
  id: string;
  name: string;
  age: number | null;
}
const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({ id: `r${i + 1}`, name: `Item ${i + 1}`, age: i === 3 ? null : 60 - i }));
const columns: Column<Row>[] = [
  { id: 'name', header: 'Name', value: (r) => r.name, sortable: true },
  { id: 'age', header: 'Age', value: (r) => r.age, sortable: true },
];
const base: DataTableProps<Row> = {
  caption: 'Items', columns, data: rows, getRowId: (r) => r.id, getRowName: (r) => r.name,
};
const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('DataTable', () => {
  it('pages and sorts: up, down, off', async () => {
    const user = userEvent.setup();
    render(<DataTable {...base} />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('1–10 of 25')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('11–20 of 25')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows()[1]).toHaveTextContent('Item 2');
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(bodyRows()[0]).toHaveTextContent('Item 25');
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
  });

  it('searches without losing focus, and clears from no results', async () => {
    const user = userEvent.setup();
    render(<DataTable {...base} />);
    const box = screen.getByLabelText('Search');
    await user.type(box, 'item 25');
    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(box).toHaveFocus();
    expect(box).toHaveValue('item 25');
    await user.type(box, 'x');
    expect(await screen.findByText('No results')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('selects across pages and runs bulk actions', async () => {
    const user = userEvent.setup();
    const onBulk = vi.fn();
    render(<DataTable {...base} selectable bulkActions={(ids, clear) => <button onClick={() => { onBulk(ids); clear(); }}>Archive</button>} />);
    await user.click(screen.getByLabelText('Select Item 1'));
    expect(screen.getByLabelText('Select all rows on this page')).toBePartiallyChecked();
    await user.click(screen.getByLabelText('Select all rows on this page'));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByLabelText('Select Item 11'));
    expect(screen.getByText('11 selected')).toBeVisible();
    await user.click(screen.getByText('Archive'));
    expect(onBulk.mock.calls[0]?.[0]).toHaveLength(11);
    expect(screen.queryByText('11 selected')).toBeNull();
  });

  it('hides columns, expands rows and opens row actions', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<DataTable {...base} renderDetails={(r) => `Details of ${r.id}`} rowActions={(r) => [{ label: 'Edit', onSelect: () => onEdit(r.id) }]} />);
    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Age' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('columnheader', { name: 'Age' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show details of Item 2' }));
    expect(screen.getByText('Details of r2')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Actions for Item 3' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith('r3');
  });

  it('shows error with retry, empty, and keeps rows when a refresh fails', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<DataTable {...base} data={undefined} error="Offline" onRetry={onRetry} />);
    await user.click(within(screen.getByRole('alert')).getByRole('button'));
    expect(onRetry).toHaveBeenCalled();
    rerender(<DataTable {...base} data={[]} />);
    expect(screen.getByText('Nothing here yet')).toBeVisible();
    rerender(<DataTable {...base} error="Offline" />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByRole('alert')).toHaveTextContent('Offline');
  });

  it('draws only the row that changed', async () => {
    const user = userEvent.setup();
    const drawn = vi.fn((r: Row) => r.name);
    const counted: Column<Row>[] = [{ id: 'name', header: 'Name', cell: drawn }];
    render(<DataTable {...base} columns={counted} selectable />);
    drawn.mockClear();
    await user.click(screen.getByRole('checkbox', { name: 'Select Item 2' }));
    expect(drawn.mock.calls.filter(([r]) => r.id !== 'r2')).toEqual([]);
    await user.click(screen.getByRole('checkbox', { name: 'Select Item 3' }));
    expect(screen.getByText('2 selected')).toBeVisible();
  });

  it('virtual draws only visible rows but selects all of them', async () => {
    const user = userEvent.setup();
    // jsdom has no layout.
    const spies = [
      vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400),
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50),
    ];
    const many = Array.from({ length: 2000 }, (_, i) => ({ id: `r${i}`, name: `Item ${i}`, age: i }));
    render(<DataTable {...base} data={many} virtual hidePagination selectable />);
    await waitFor(() => expect(screen.getByText('Item 0').closest('tr')).toHaveAttribute('aria-rowindex', '2'));
    expect(bodyRows().length).toBeLessThan(40);
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '2001');
    await user.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(screen.getByText('2000 selected')).toBeVisible();
    spies.forEach((spy) => spy.mockRestore());
  });

  it('server mode shows the rows as they come', async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(<DataTable {...base} mode="server" data={rows.slice(0, 3)} total={300} state={defaultTableState} onStateChange={onStateChange} />);
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText('1–10 of 300')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Age' }));
    expect(onStateChange).toHaveBeenLastCalledWith({ ...defaultTableState, sort: { id: 'age', direction: 'asc' } });
  });

  it('keeps its state in the URL', async () => {
    const user = userEvent.setup();
    function Page() {
      const [state, setState] = useTableState();
      return (
        <>
          <output>{useLocation().search}</output>
          <DataTable {...base} state={state} onStateChange={setState} />
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={['/?page=2&other=1&size=nonsense']}>
        <Page />
      </MemoryRouter>,
    );
    expect(screen.getByText('11–20 of 25')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Age' }));
    expect(document.querySelector('output')).toHaveTextContent('other=1');
    expect(document.querySelector('output')).toHaveTextContent('sort=age%3Aasc');
    expect(document.querySelector('output')).not.toHaveTextContent('page=');
  });
});

describe('table helpers', () => {
  it('sorts numbers inside text and puts empty values last', () => {
    const asc = processRows(rows, columns, { ...defaultTableState, sort: { id: 'age', direction: 'asc' } });
    const desc = processRows(rows, columns, { ...defaultTableState, sort: { id: 'age', direction: 'desc' } });
    expect(asc.at(-1)?.age).toBeNull();
    expect(desc.at(-1)?.age).toBeNull();
    expect(desc[0]?.age).toBe(60);
  });
  it('escapes CSV and stops formulas', () => {
    expect(toCsv([['a,b', 'say "hi"', '=1+1', -5, null]])).toBe('"a,b","say ""hi""",\'=1+1,-5,');
  });
  it('shortens long page lists', () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(5, 20)).toEqual([1, 'gap', 4, 5, 6, 'gap', 20]);
    expect(pageList(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('Pagination handles no rows and marks the current page', () => {
    const { rerender } = render(<Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />);
    expect(screen.getByText('0–0 of 0')).toBeVisible();
    rerender(<Pagination page={2} pageSize={10} total={30} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('states', () => {
  it('AsyncView waits before the loader, then shows each state', async () => {
    vi.useFakeTimers();
    const view = (p: { data?: string[]; isLoading?: boolean; error?: string }) => (
      <AsyncView data={p.data} isLoading={!!p.isLoading} error={p.error} isEmpty={(d) => !d.length}>
        {(d) => <p>{d.join()}</p>}
      </AsyncView>
    );
    const { rerender } = render(view({ isLoading: true }));
    expect(screen.queryByText('Loading')).toBeNull();
    act(() => void vi.advanceTimersByTime(250));
    expect(screen.getByText('Loading')).toBeInTheDocument();
    rerender(view({ error: 'Offline' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Offline');
    rerender(view({ data: [] }));
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    rerender(view({ data: ['x'], error: 'refresh failed' }));
    expect(screen.getByText('x')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('ErrorBoundary recovers with retry and with a new key', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    let broken = true;
    const Part = () => {
      if (broken) throw new Error('x');
      return <p>Fine</p>;
    };
    const { rerender } = render(<ErrorBoundary resetKey="a" onError={onError}><Part /></ErrorBoundary>);
    expect(onError).toHaveBeenCalled();
    broken = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Fine')).toBeVisible();
    broken = true;
    rerender(<ErrorBoundary resetKey="b" onError={onError}><Part /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeVisible();
    broken = false;
    rerender(<ErrorBoundary resetKey="c" onError={onError}><Part /></ErrorBoundary>);
    expect(screen.getByText('Fine')).toBeVisible();
    quiet.mockRestore();
  });

  it('LoadingOverlay blocks its content and Progress reports its value', () => {
    function Demo() {
      const [on] = useState(true);
      return <LoadingOverlay active={on}><button>Save</button></LoadingOverlay>;
    }
    render(
      <>
        <Demo />
        <Progress label="Upload" value={140} />
      </>,
    );
    expect(screen.getByText('Save').closest('[inert]')).not.toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute('aria-valuenow', '100');
  });
});
