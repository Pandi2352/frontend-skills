import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandMenu, type Command } from '@/components/shared/command-menu';
import { useStepper } from '@/hooks/useStepper';
import { useUrlState } from '@/hooks/useUrlState';
import { Accordion } from './accordion';
import { StatCard } from './card';
import { CopyButton } from './copy-button';
import { KeyValueList } from './key-value-list';
import { Stepper } from './stepper';
import { Tabs, type TabItem } from './tabs';

vi.setConfig({ testTimeout: 30_000 });

const tabs: TabItem[] = [
  { id: 'a', label: 'General', content: <input aria-label="Name" /> },
  { id: 'b', label: 'Locked', disabled: true, content: 'Never' },
  { id: 'c', label: 'Billing', content: 'Invoices' },
];

describe('Tabs', () => {
  it('moves with arrow keys, skips disabled, draws only the open panel', async () => {
    const user = userEvent.setup();
    render(<Tabs label="Settings" items={tabs} />);
    expect(screen.getByRole('tabpanel', { name: 'General' })).toBeVisible();
    expect(screen.queryByText('Invoices')).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'General' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveFocus();
    expect(screen.getByText('Invoices')).toBeVisible();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps visited panels on request, and ignores unknown ids', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Tabs label="Settings" items={tabs} keepMounted />);
    await user.type(screen.getByLabelText('Name'), 'Asha');
    await user.click(screen.getByRole('tab', { name: 'Billing' }));
    await user.click(screen.getByRole('tab', { name: 'General' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Asha');
    unmount();
    render(<Tabs label="Settings" items={tabs} value="old" />);
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
  });

  it('useUrlState keeps the value in the address and refuses others', async () => {
    const user = userEvent.setup();
    function Page() {
      const [tab, setTab] = useUrlState('tab', 'a', ['a', 'c']);
      return (
        <>
          <output>{useLocation().search}</output>
          <Tabs label="Settings" items={tabs} value={tab} onChange={(next) => setTab(next as 'a' | 'c')} />
        </>
      );
    }
    render(<MemoryRouter initialEntries={['/?tab=hack&q=1']}><Page /></MemoryRouter>);
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Billing' }));
    expect(screen.getByRole('status')).toHaveTextContent('?tab=c&q=1');
    await user.click(screen.getByRole('tab', { name: 'General' }));
    expect(screen.getByRole('status')).toHaveTextContent('?q=1');
  });
});

it('Accordion opens one, or many', async () => {
  const user = userEvent.setup();
  const items = [{ id: '1', title: 'One', content: 'First' }, { id: '2', title: 'Two', content: 'Second' }];
  const { unmount } = render(<Accordion items={items} />);
  await user.click(screen.getByRole('button', { name: 'One' }));
  expect(screen.getByRole('region', { name: 'One' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Two' }));
  expect(screen.getByText('First')).not.toBeVisible();
  expect(screen.getByRole('button', { name: 'Two' })).toHaveAttribute('aria-expanded', 'true');
  unmount();
  render(<Accordion items={items} multiple defaultValue={['1']} />);
  await user.click(screen.getByRole('button', { name: 'Two' }));
  expect(screen.getByText('First')).toBeVisible();
  expect(screen.getByText('Second')).toBeVisible();
});

it('StatCard says the direction in words', () => {
  render(<StatCard label="Errors" value="12" change={-0.253} changeNote="than last week" lowerIsBetter />);
  expect(screen.getByText('decreased by')).toBeInTheDocument();
  expect(screen.getByText(/25\.3%/)).toHaveClass('text-success');
});

it('Stepper opens only reached steps; useStepper waits for the check', async () => {
  const user = userEvent.setup();
  const open = vi.fn();
  render(
    <Stepper label="Order" current={1} reached={1} onStepClick={open}
      steps={[{ id: 'a', label: 'Cart' }, { id: 'b', label: 'Address' }, { id: 'c', label: 'Pay' }]} />,
  );
  await user.click(screen.getByRole('button', { name: 'Cart' }));
  expect(open).toHaveBeenCalledWith(0);
  expect(screen.queryByRole('button', { name: 'Pay' })).toBeNull();
  expect(screen.getAllByText('Address').at(-1)?.closest('li')).toHaveAttribute('aria-current', 'step');

  const { result } = renderHook(() => useStepper(2));
  await act(async () => { await result.current.next(() => false); });
  expect(result.current.current).toBe(0);
  await act(async () => { await result.current.next(async () => true); });
  expect(result.current.isLast).toBe(true);
  await act(async () => { await result.current.next(); });
  expect(result.current.current).toBe(1);
});

it('CopyButton tells the result, also when copying is not allowed', async () => {
  const user = userEvent.setup();
  render(<CopyButton text="ORD-1" label="Copy order number" iconOnly />);
  await user.click(screen.getByRole('button', { name: 'Copy order number' }));
  expect(await screen.findByText('Copied')).toBeInTheDocument();
  expect(await navigator.clipboard.readText()).toBe('ORD-1');
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  await user.click(screen.getByRole('button', { name: 'Copy order number' }));
  expect(await screen.findByText('Could not copy')).toBeInTheDocument();
});

it('KeyValueList shows a dash for nothing, but not for zero', () => {
  render(<KeyValueList items={[{ label: 'Name', value: '' }, { label: 'Count', value: 0 }]} />);
  expect(screen.getByText('—')).toBeVisible();
  expect(screen.getByText('0')).toBeVisible();
});

describe('CommandMenu', () => {
  beforeEach(() => localStorage.clear());

  it('filters, moves in drawn order, runs, and remembers', async () => {
    const user = userEvent.setup();
    const ran = vi.fn();
    const onClose = vi.fn();
    const commands: Command[] = [
      { id: 'users', label: 'Users', group: 'Go to', onSelect: () => ran('users') },
      { id: 'new', label: 'New user', group: 'Create', keywords: 'add', onSelect: () => ran('new') },
      { id: 'cafe', label: 'Café', group: 'Go to', onSelect: () => ran('cafe') },
    ];
    const view = (open: boolean) => <CommandMenu open={open} onClose={onClose} commands={commands} recentKey="test" />;
    const { rerender } = render(view(true));
    const box = await screen.findByRole('combobox', { name: 'Search commands' });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Users', 'Café', 'New user']);
    await user.type(box, 'cafe{Enter}');
    expect(ran).toHaveBeenLastCalledWith('cafe');
    expect(onClose).toHaveBeenCalled();
    rerender(view(false));
    rerender(view(true));
    await screen.findByRole('combobox', { name: 'Search commands' });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Café', 'Users', 'New user']);
    await user.keyboard('{ArrowUp}{Enter}');
    expect(ran).toHaveBeenLastCalledWith('new');
    await user.type(screen.getByRole('combobox', { name: 'Search commands' }), 'zzz');
    expect(screen.getAllByText('No commands found')[0]).toBeVisible();
  });
});
