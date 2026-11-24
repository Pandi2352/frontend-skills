import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmProvider, useConfirm, type ConfirmOptions } from '@/components/shared/confirm';
import { Button } from './button';
import { DropdownMenu } from './dropdown-menu';
import { DatePicker, Dropdown } from './fields';
import { Drawer, Modal, type ModalProps } from './modal';
import { Toaster, toast } from './toast';
import { Tooltip } from './tooltip';

vi.setConfig({ testTimeout: 30_000 });

function ModalDemo(props: Partial<ModalProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal title="Edit" open={open} onClose={() => setOpen(false)} {...props}>
        {props.children ?? <input aria-label="Name" />}
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('moves focus in, closes with Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(<ModalDemo description="More" />);
    await user.click(screen.getByText('Open'));
    const dialog = screen.getByRole('dialog', { name: 'Edit' });
    expect(dialog).toHaveAccessibleDescription('More');
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    await user.tab();
    await user.tab();
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(screen.getByText('Open')).toHaveFocus());
  });

  it('stays open while busy, when not dismissible, or when beforeClose says no', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ModalDemo busy />);
    await user.click(screen.getByText('Open'));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    rerender(<ModalDemo dismissible={false} />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    const beforeClose = vi.fn().mockReturnValue(false);
    rerender(<ModalDemo beforeClose={beforeClose} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(beforeClose).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
  });

  it('keeps open while a dropdown or calendar inside it is used', async () => {
    const user = userEvent.setup();
    render(
      <ModalDemo>
        <Dropdown label="Role" options={[{ value: 'a', label: 'Admin' }]} />
        <DatePicker label="Day" defaultValue="2026-03-10" />
      </ModalDemo>,
    );
    await user.click(screen.getByText('Open'));
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(screen.getByRole('option', { name: 'Admin' }));
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent('Admin');

    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await user.click(screen.getByRole('button', { name: /March 12, 2026/ }));
    expect(screen.getByLabelText('Day')).toHaveValue('03/12/2026');
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Drawer closes on an outside press, but not on a toast', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <>
        <Toaster />
        <Drawer open title="Menu" onClose={onClose}>
          Content
        </Drawer>
      </>,
    );
    act(() => void toast.info('Hello'));
    await user.click(document.querySelector('[data-toaster] li') as Element);
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('dialog').parentElement as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => toast.dismiss());
  });
});

describe('useConfirm', () => {
  function Ask({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (yes: boolean) => void }) {
    const confirm = useConfirm();
    return <button onClick={() => void confirm(options).then(onAnswer)}>Ask</button>;
  }
  const setup = (options: ConfirmOptions) => {
    const onAnswer = vi.fn();
    render(
      <ConfirmProvider>
        <Ask options={options} onAnswer={onAnswer} />
      </ConfirmProvider>,
    );
    return onAnswer;
  };

  it('focuses Cancel and answers', async () => {
    const user = userEvent.setup();
    const onAnswer = setup({ title: 'Delete?', message: 'Forever', confirmLabel: 'Delete' });
    await user.click(screen.getByText('Ask'));
    expect(screen.getByRole('alertdialog', { name: 'Delete?' })).toHaveAccessibleDescription('Forever');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByText('Ask'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAnswer).toHaveBeenLastCalledWith(true);
  });

  it('needs the typed text and shows a failed action', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('Server said no')).mockResolvedValue(undefined);
    const onAnswer = setup({ title: 'Delete?', requireText: 'DELETE', onConfirm });
    await user.click(screen.getByText('Ask'));
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await user.type(screen.getByLabelText('Type "DELETE" to confirm'), 'DELETE');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('Server said no')).toBeVisible();
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true));
  });
});

describe('toast', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    act(() => toast.dismiss());
    vi.useRealTimers();
  });
  const list = () => within(screen.getByRole('list'));

  it('announces, and closes by itself except errors', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Saved');
      toast.error('Failed');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    act(() => void vi.advanceTimersByTime(5100));
    expect(list().queryByText('Saved')).toBeNull();
    expect(list().getByText('Failed')).toBeVisible();
  });

  it('pauses while focused or hovered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Toaster />);
    act(() => void toast.success('Saved'));
    await user.hover(list().getByText('Saved'));
    act(() => void vi.advanceTimersByTime(20_000));
    expect(list().getByText('Saved')).toBeVisible();
    await user.unhover(list().getByText('Saved'));
    act(() => void vi.advanceTimersByTime(6000));
    expect(list().queryByText('Saved')).toBeNull();
  });

  it('merges equal ones, limits the rest, and runs actions', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onClick = vi.fn();
    render(<Toaster max={2} />);
    act(() => {
      toast.error('A');
      toast.error('A');
      toast.info('B', { action: { label: 'Undo', onClick } });
      toast.error('C');
    });
    expect(list().getAllByRole('listitem')).toHaveLength(2);
    expect(list().getByText('(2)', { exact: false })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(list().getByText('C')).toBeVisible();
  });

  it('promise changes from loading to the result', async () => {
    render(<Toaster />);
    let finish = (_value: string) => {};
    const work = new Promise<string>((resolve) => (finish = resolve));
    act(() => void toast.promise(work, { loading: 'Working', success: (v) => `Done ${v}`, error: 'Bad' }));
    expect(list().getByText('Working')).toBeVisible();
    await act(async () => finish('ok'));
    expect(list().getByText('Done ok')).toBeVisible();
    expect(list().queryByText('Working')).toBeNull();
  });
});

describe('DropdownMenu and Tooltip', () => {
  it('works with the keyboard and skips disabled items', async () => {
    const user = userEvent.setup();
    const edit = vi.fn();
    const remove = vi.fn();
    render(
      <DropdownMenu
        items={[
          { label: 'Edit', onSelect: edit },
          { label: 'Copy', disabled: true },
          { kind: 'separator' },
          { label: 'Remove', onSelect: remove },
        ]}
        trigger={(p) => <Button {...p}>Menu</Button>}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(remove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps open for checkbox items', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DropdownMenu items={[{ label: 'Name', checked: true, onSelect }]} trigger={(p) => <Button {...p}>Menu</Button>} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Name', checked: true }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('Tooltip describes on focus and hides with Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip text="Help">
        <Button>Save</Button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Help');
    expect(screen.getByRole('button')).toHaveAccessibleDescription('Help');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
