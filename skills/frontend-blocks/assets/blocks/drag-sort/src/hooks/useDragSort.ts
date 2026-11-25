import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useStableCallback } from './useStableCallback';

export interface DragList {
  id: string;
  label: string;
  items: string[];
}

export interface DragMove {
  id: string;
  fromList: string;
  toList: string;
  /** Position in the target list, without the moved item. */
  index: number;
}

interface Drag {
  id: string;
  list: string;
  index: number;
  by: 'pointer' | 'keyboard';
}

export const dragText = {
  handle: (name: string) => `Move ${name}`,
  hint: 'Press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.',
  picked: (name: string, position: number, count: number) => `${name} picked up. Position ${position} of ${count}.`,
  moved: (list: string, position: number, count: number) => `${list}, position ${position} of ${count}.`,
  dropped: (name: string, list: string, position: number) => `${name} dropped in ${list}, position ${position}.`,
  cancelled: (name: string) => `${name} was put back.`,
};

/** The lists as they would be after the move. */
export function moveItem(lists: DragList[], id: string, toList: string, index: number): DragList[] {
  return lists.map((list) => {
    const rest = list.items.filter((item) => item !== id);
    if (list.id !== toList) return rest.length === list.items.length ? list : { ...list, items: rest };
    const at = Math.min(Math.max(index, 0), rest.length);
    return { ...list, items: [...rest.slice(0, at), id, ...rest.slice(at)] };
  });
}

/** Index by the middle of the other items, so an item never jumps back and forth. */
function indexAt(list: HTMLElement, id: string, y: number) {
  const others = [...list.querySelectorAll<HTMLElement>('[data-drag-item]')].filter((e) => e.dataset.dragItem !== id);
  const next = others.findIndex((e) => {
    const box = e.getBoundingClientRect();
    return y < box.top + box.height / 2;
  });
  return next < 0 ? others.length : next;
}

function scrollNear(element: Element | null, x: number, y: number) {
  for (let e = element; e; e = e.parentElement) {
    const box = e.getBoundingClientRect();
    if (e.scrollHeight > e.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(e).overflowY)) {
      if (y < box.top + 40) e.scrollTop -= 12;
      else if (y > box.bottom - 40) e.scrollTop += 12;
    }
    if (e.scrollWidth > e.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(e).overflowX)) {
      if (x < box.left + 40) e.scrollLeft -= 12;
      else if (x > box.right - 40) e.scrollLeft += 12;
    }
  }
}

/**
 * Sorting in one list or between several, with mouse, touch and keyboard.
 * Draw `lists`: during a drag it already shows the new order.
 */
export function useDragSort(options: {
  lists: DragList[];
  getName: (id: string) => string;
  onMove: (move: DragMove) => void;
  disabled?: boolean;
}) {
  const { lists, getName, disabled = false } = options;
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState('');
  const focusId = useRef<string | null>(null);

  const listOf = (id: string) => lists.find((l) => l.items.includes(id));
  const shown = drag ? moveItem(lists, drag.id, drag.list, drag.index) : lists;

  const finish = useStableCallback((keep: boolean) => {
    if (!drag) return;
    const from = listOf(drag.id);
    const target = lists.find((l) => l.id === drag.list);
    if (drag.by === 'keyboard') focusId.current = drag.id;
    setDrag(null);
    if (!from || !target || !keep) {
      setMessage(dragText.cancelled(getName(drag.id)));
      return;
    }
    setMessage(dragText.dropped(getName(drag.id), target.label, drag.index + 1));
    if (from.id === drag.list && from.items.indexOf(drag.id) === drag.index) return;
    options.onMove({ id: drag.id, fromList: from.id, toList: drag.list, index: drag.index });
  });

  const follow = useStableCallback((x: number, y: number) => {
    if (!drag) return;
    const under = document.elementFromPoint(x, y);
    scrollNear(under, x, y);
    const element = under?.closest<HTMLElement>('[data-drag-list]');
    const list = element?.dataset.dragList;
    if (!element || list === undefined || !lists.some((l) => l.id === list)) return;
    const index = indexAt(element, drag.id, y);
    if (list !== drag.list || index !== drag.index) setDrag({ ...drag, list, index });
  });

  const byPointer = drag?.by === 'pointer';
  useEffect(() => {
    if (!byPointer) return;
    // On the window: an item that changes lists is a new element.
    const stop = new AbortController();
    const { signal } = stop;
    window.addEventListener('pointermove', (e) => follow(e.clientX, e.clientY), { signal });
    window.addEventListener('pointerup', () => finish(true), { signal });
    window.addEventListener('pointercancel', () => finish(false), { signal });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && finish(false), { signal });
    return () => stop.abort();
  }, [byPointer, follow, finish]);

  // After a keyboard move to another list the handle is a new button.
  useLayoutEffect(() => {
    const id = drag?.by === 'keyboard' ? drag.id : focusId.current;
    focusId.current = null;
    if (id) document.querySelector<HTMLElement>(`[data-drag-handle="${CSS.escape(id)}"]`)?.focus();
  }, [drag]);

  const step = (to: Drag) => {
    const list = moveItem(lists, to.id, to.list, to.index).find((l) => l.id === to.list);
    if (!list) return;
    const index = list.items.indexOf(to.id);
    setDrag({ ...to, index });
    setMessage(dragText.moved(list.label, index + 1, list.items.length));
  };

  const onKeyDown = (id: string) => (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    const list = listOf(id);
    if (!list) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (drag) return finish(true);
      const index = list.items.indexOf(id);
      setDrag({ id, list: list.id, index, by: 'keyboard' });
      setMessage(`${dragText.picked(getName(id), index + 1, list.items.length)} ${dragText.hint}`);
      return;
    }
    if (drag?.by !== 'keyboard' || drag.id !== id) return;
    const at = lists.findIndex((l) => l.id === drag.list);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const before = lists[at - 1];
    const after = lists[at + 1];
    const sideways = { [rtl ? 'ArrowRight' : 'ArrowLeft']: before, [rtl ? 'ArrowLeft' : 'ArrowRight']: after }[event.key];
    if (event.key === 'Escape') {
      event.stopPropagation();
      finish(false);
    } else if (event.key === 'ArrowUp') step({ ...drag, index: drag.index - 1 });
    else if (event.key === 'ArrowDown') step({ ...drag, index: drag.index + 1 });
    else if (sideways) step({ ...drag, list: sideways.id });
    else if (event.key === 'Tab') finish(false);
    if (event.key.startsWith('Arrow')) event.preventDefault();
  };

  return {
    /** The lists to draw. */
    lists: shown,
    draggingId: drag?.id ?? null,
    overList: drag?.list ?? null,
    /** Put it in a visually hidden `role="status"`. */
    message,
    listProps: (list: string) => ({ 'data-drag-list': list }),
    itemProps: (id: string) => ({ 'data-drag-item': id }),
    /** For a button. */
    handleProps: (id: string) => ({
      'data-drag-handle': id,
      'aria-label': dragText.handle(getName(id)),
      'aria-pressed': drag?.id === id,
      disabled,
      onKeyDown: onKeyDown(id),
      onBlur: () => {
        // Only when focus really leaves; moving lists also blurs for a moment.
        if (drag?.by === 'keyboard') setTimeout(() => document.activeElement === document.body || document.activeElement?.getAttribute('data-drag-handle') === id || finish(false));
      },
      onPointerDown: (event: PointerEvent) => {
        const list = listOf(id);
        if (disabled || event.button !== 0 || !list) return;
        event.preventDefault();
        setDrag({ id, list: list.id, index: list.items.indexOf(id), by: 'pointer' });
      },
    }),
  };
}
