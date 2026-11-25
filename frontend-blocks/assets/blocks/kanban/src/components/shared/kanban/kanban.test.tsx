import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SortableList } from '@/components/shared/sortable-list';
import { moveItem } from '@/hooks/useDragSort';
import { applyKanbanMove, KanbanBoard } from './index';

interface Card { id: string; title: string; status: string }
const start: Card[] = [
  { id: '1', title: 'Write', status: 'todo' },
  { id: '2', title: 'Test', status: 'todo' },
  { id: '3', title: 'Ship', status: 'done' },
];
const getId = (c: Card) => c.id;
const getStatus = (c: Card) => c.status;

function Board({ onMove }: { onMove: (m: unknown) => void }) {
  const [cards, setCards] = useState(start);
  return (
    <KanbanBoard
      label="Work" cards={cards} getId={getId} getName={(c) => c.title} getColumn={getStatus}
      columns={[{ id: 'todo', title: 'To do', limit: 1 }, { id: 'done', title: 'Done' }]}
      renderCard={(c) => c.title}
      onMove={(m) => {
        onMove(m);
        setCards(applyKanbanMove(cards, m, getId, getStatus, (c, status) => ({ ...c, status })));
      }}
    />
  );
}
const column = (name: string) => within(screen.getByRole('region', { name }));
const titles = (name: string) => column(name).getAllByRole('listitem').map((l) => l.textContent);

describe('moveItem', () => {
  it('moves within and between lists and clamps', () => {
    const lists = [{ id: 'a', label: 'A', items: ['1', '2', '3'] }, { id: 'b', label: 'B', items: [] }];
    expect(moveItem(lists, '1', 'a', 2)[0]?.items).toEqual(['2', '3', '1']);
    expect(moveItem(lists, '2', 'b', 9).map((l) => l.items)).toEqual([['1', '3'], ['2']]);
    expect(moveItem(lists, '3', 'a', -4)[0]?.items).toEqual(['3', '1', '2']);
  });
});

describe('KanbanBoard', () => {
  it('moves a card to another column with the keyboard and keeps focus', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    screen.getByRole('button', { name: 'Move Test' }).focus();
    await user.keyboard(' {ArrowRight}');
    expect(titles('Done')).toEqual(['Ship', 'Test']);
    expect(onMove).not.toHaveBeenCalled();
    await user.keyboard('{ArrowUp}');
    expect(titles('Done')).toEqual(['Test', 'Ship']);
    await user.keyboard(' ');
    expect(onMove).toHaveBeenCalledWith({ id: '2', fromList: 'todo', toList: 'done', index: 0 });
    expect(screen.getByRole('button', { name: 'Move Test' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Test dropped in Done, position 1.');
    expect(titles('Done')).toEqual(['Test', 'Ship']);
  });

  it('puts it back on Escape, and warns above the limit', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    expect(column('To do').getByText(/More than the limit of 1/)).toBeInTheDocument();
    screen.getByRole('button', { name: 'Move Write' }).focus();
    await user.keyboard(' {ArrowDown}{Escape}');
    expect(titles('To do')).toEqual(['Write', 'Test']);
    expect(onMove).not.toHaveBeenCalled();
  });
});

it('SortableList sorts with the pointer', () => {
  const onReorder = vi.fn();
  render(<SortableList label="Steps" items={start} getId={getId} getName={(c) => c.title} renderItem={(c) => c.title} onReorder={onReorder} />);
  const list = screen.getByRole('list', { name: 'Steps' });
  // jsdom has no layout: rows of 40 pixels.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const i = [...list.children].indexOf(this);
    return { top: i * 40, height: 40, bottom: i * 40 + 40, left: 0, right: 100 } as DOMRect;
  });
  document.elementFromPoint = () => list;
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Move Write' }), { button: 0 });
  fireEvent.pointerMove(window, { clientX: 10, clientY: 75 });
  expect(within(list).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Test', 'Write', 'Ship']);
  fireEvent.pointerUp(window);
  expect(onReorder.mock.calls[0]?.[0].map(getId)).toEqual(['2', '1', '3']);
  expect(onReorder.mock.calls[0]?.[1]).toMatchObject({ from: 0, to: 1 });
  vi.restoreAllMocks();
});
