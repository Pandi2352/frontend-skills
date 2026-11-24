import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  useFieldArray, type ArrayPath, type Control, type FieldArray, type FieldValues,
} from 'react-hook-form';
import { Button, IconButton } from '@/components/ui/button';
import { fieldText } from '@/constants/field-text';

export interface RepeatableFieldsProps<V extends FieldValues, N extends ArrayPath<V>> {
  control: Control<V>;
  name: N;
  label: string;
  /** Used in button names: "Remove Contact 2". */
  itemLabel: string;
  newItem: FieldArray<V, N>;
  min?: number;
  max?: number;
  reorder?: boolean;
  error?: string | undefined;
  /** Use names like `contacts.${index}.email`. */
  render: (index: number) => ReactNode;
}

export function RepeatableFields<V extends FieldValues, N extends ArrayPath<V>>(
  props: RepeatableFieldsProps<V, N>,
) {
  const { control, name, label, itemLabel, newItem, min = 0, max = Infinity, reorder, error, render } = props;
  const { fields, append, remove, move } = useFieldArray({ control, name });
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-3">
      <span className="text-sm font-medium">{label}</span>
      {fields.map((row, i) => {
        const title = `${itemLabel} ${i + 1}`;
        return (
          <div key={row.id} role="group" aria-label={title} className="flex items-start gap-2 rounded-md border border-line p-3">
            <div className="min-w-0 flex-1">{render(i)}</div>
            <div className="flex flex-col">
              {reorder && (
                <>
                  <IconButton icon={ArrowUp} size="sm" label={`${fieldText.moveUp}: ${title}`} disabled={i === 0} onClick={() => move(i, i - 1)} />
                  <IconButton icon={ArrowDown} size="sm" label={`${fieldText.moveDown}: ${title}`} disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} />
                </>
              )}
              <IconButton icon={X} size="sm" label={fieldText.remove(title)} disabled={fields.length <= min} onClick={() => remove(i)} />
            </div>
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button variant="outline" leftIcon={Plus} className="self-start" disabled={fields.length >= max} onClick={() => append(newItem)}>
        {fieldText.add} {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
