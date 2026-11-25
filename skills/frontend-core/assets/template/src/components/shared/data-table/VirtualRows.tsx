import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode, RefObject } from 'react';

interface VirtualRowsProps {
  count: number;
  ids: string[];
  scroller: RefObject<HTMLDivElement | null>;
  span: number;
  /** Guess until a row is measured. */
  rowHeight: number;
  renderRow: (index: number) => ReactNode;
}

function Space({ height, span }: { height: number; span: number }) {
  if (height <= 0) return null;
  return (
    <tbody aria-hidden>
      <tr>
        <td colSpan={span} style={{ height, padding: 0 }} />
      </tr>
    </tbody>
  );
}

/**
 * The rows on screen, with empty space for the others. Each row has its own
 * tbody, so open details are measured together with it.
 */
export function VirtualRows({ count, ids, scroller, span, rowHeight, renderRow }: VirtualRowsProps) {
  'use no memo'; // The virtualizer changes inside, which React Compiler cannot see.
  // eslint-disable-next-line react-hooks/incompatible-library -- handled by "use no memo"
  const rows = useVirtualizer({
    count,
    getScrollElement: () => scroller.current,
    estimateSize: () => rowHeight,
    getItemKey: (index) => ids[index] ?? index,
    overscan: 8,
  });
  const shown = rows.getVirtualItems();

  return (
    <>
      <Space height={shown[0]?.start ?? 0} span={span} />
      {shown.map((item) => (
        <tbody key={item.key} ref={rows.measureElement} data-index={item.index}>
          {renderRow(item.index)}
        </tbody>
      ))}
      <Space height={rows.getTotalSize() - (shown.at(-1)?.end ?? 0)} span={span} />
    </>
  );
}
