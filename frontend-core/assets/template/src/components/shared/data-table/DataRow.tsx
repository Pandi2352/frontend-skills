import { ChevronDown, ChevronRight } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { IconButton } from '@/components/ui/button';
import type { MenuItem } from '@/components/ui/dropdown-menu';
import { CheckboxBox } from '@/components/ui/fields/choice/Checkbox';
import { uiText } from '@/constants/ui-text';
import { cn } from '@/lib/cn';
import { RowActions } from './RowActions';
import { alignClass, showCell, type Column } from './types';

export interface RowSettings<T> {
  columns: Column<T>[];
  cellPad: string;
  detailsId: string;
  span: number;
  selectable: boolean | undefined;
  rowActions: ((row: T) => MenuItem[]) | undefined;
  renderDetails: ((row: T) => ReactNode) | undefined;
  onSelect: (id: string, on: boolean) => void;
  onToggle: (id: string) => void;
}

interface DataRowProps<T> extends RowSettings<T> {
  row: T;
  id: string;
  name: string;
  isSelected: boolean;
  isOpen: boolean;
  /** Position in the table, for screen readers, when not every row is drawn. */
  position?: number | undefined;
}

function Row<T>(props: DataRowProps<T>) {
  const {
    row, id, name, isSelected, isOpen, position, columns, cellPad, detailsId, span,
    selectable, rowActions, renderDetails, onSelect, onToggle,
  } = props;
  return (
    <>
      <tr
        aria-rowindex={position}
        className={cn('border-t border-line', isSelected ? 'bg-primary-subtle' : 'hover:bg-subtle')}
      >
        {renderDetails && (
          <td className="px-1">
            <IconButton
              icon={isOpen ? ChevronDown : ChevronRight}
              size="sm"
              label={uiText.expandRow(name)}
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${detailsId}-${id}` : undefined}
              onClick={() => onToggle(id)}
            />
          </td>
        )}
        {selectable && (
          <td className={cellPad}>
            <CheckboxBox aria-label={uiText.selectRow(name)} checked={isSelected} onChange={(on) => onSelect(id, on)} />
          </td>
        )}
        {columns.map((c) => (
          <td key={c.id} className={cn(cellPad, alignClass[c.align ?? 'start'], c.align === 'end' && 'tabular-nums', c.className)}>
            {showCell(c, row)}
          </td>
        ))}
        {rowActions && (
          <td className="px-2 text-end">
            <RowActions name={name} items={rowActions(row)} />
          </td>
        )}
      </tr>
      {renderDetails && isOpen && (
        <tr id={`${detailsId}-${id}`} className="border-t border-line bg-subtle">
          <td colSpan={span} className="p-4">
            {renderDetails(row)}
          </td>
        </tr>
      )}
    </>
  );
}

/** One table row. Draws again only when its own data or state changes. */
export const DataRow = memo(Row) as typeof Row;
