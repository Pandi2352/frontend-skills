import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type Ref } from 'react';
import { IconButton } from '@/components/ui/button';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { cn } from '@/lib/cn';
import {
  FieldShell, HiddenInputs, useField, type BaseFieldProps, type Option, type ValueProps,
} from '../base';
import { CheckboxBox } from '../choice/Checkbox';

export interface TransferListProps extends BaseFieldProps, ValueProps<string[]> {
  options: Option[];
  ref?: Ref<HTMLInputElement>;
}

interface ColumnProps {
  boxRef?: Ref<HTMLInputElement> | undefined;
  title: string;
  options: Option[];
  marked: string[];
  onMark: (marked: string[]) => void;
  locked: boolean;
  invalid: boolean;
}

function Column({ boxRef, title, options, marked, onMark, locked, invalid }: ColumnProps) {
  const [query, setQuery] = useState('');
  const shown = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const free = shown.filter((o) => !o.disabled).map((o) => o.value);
  const all = free.length > 0 && free.every((v) => marked.includes(v));
  return (
    <div
      role="group"
      aria-label={title}
      className={cn('min-w-0 flex-1 rounded-md border bg-surface', invalid ? 'border-danger' : 'border-control-line')}
    >
      <label className="flex min-h-control items-center gap-2 border-b border-line px-3 text-sm font-medium">
        <CheckboxBox
          ref={boxRef}
          checked={all}
          indeterminate={!all && free.some((v) => marked.includes(v))}
          disabled={locked || free.length === 0}
          onChange={(on) =>
            onMark(on ? [...new Set([...marked, ...free])] : marked.filter((v) => !free.includes(v)))
          }
        />
        {title} ({options.length})
      </label>
      <input
        type="text"
        aria-label={`${fieldText.search}: ${title}`}
        placeholder={fieldText.search}
        value={query}
        disabled={locked}
        onChange={(event) => setQuery(event.target.value)}
        className="h-control w-full border-b border-line bg-transparent px-3 text-base placeholder:text-placeholder md:text-sm"
      />
      <div className="h-48 overflow-auto p-1">
        {shown.map((o) => (
          <label key={o.value} className="flex min-h-control items-center gap-2 rounded-md px-2 text-sm hover:bg-subtle">
            <CheckboxBox
              checked={marked.includes(o.value)}
              disabled={locked || o.disabled}
              onChange={(on) => onMark(on ? [...marked, o.value] : marked.filter((v) => v !== o.value))}
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
        {shown.length === 0 && <p className="p-2 text-sm text-muted">{query ? fieldText.noResults : fieldText.emptyList}</p>}
      </div>
    </div>
  );
}

export function TransferList(props: TransferListProps) {
  const { shell, state, controlClassName, rest } = useField(props);
  const { options, name, ref } = rest;
  const [values, setValues] = useControllableState<string[]>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? [],
    onChange: rest.onChange,
  });
  const [left, setLeft] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);
  const locked = state.disabled || state.readOnly;
  const shared = { locked, invalid: state.invalid };

  return (
    <FieldShell shell={shell} group="group">
      <div className={cn('flex flex-col items-stretch gap-2 sm:flex-row sm:items-center', controlClassName)}>
        <Column
          {...shared}
          boxRef={ref}
          title={fieldText.available}
          options={options.filter((o) => !values.includes(o.value))}
          marked={left}
          onMark={setLeft}
        />
        <div className="flex justify-center gap-2 sm:flex-col">
          <IconButton
            icon={ChevronRight}
            variant="outline"
            label={fieldText.addSelected}
            disabled={locked || left.length === 0}
            onClick={() => {
              setValues([...values, ...left]);
              setLeft([]);
            }}
          />
          <IconButton
            icon={ChevronLeft}
            variant="outline"
            label={fieldText.removeSelected}
            disabled={locked || right.length === 0}
            onClick={() => {
              setValues(values.filter((v) => !right.includes(v)));
              setRight([]);
            }}
          />
        </div>
        <Column
          {...shared}
          title={fieldText.selected}
          options={options.filter((o) => values.includes(o.value))}
          marked={right}
          onMark={setRight}
        />
      </div>
      <HiddenInputs name={name} values={values} disabled={state.disabled} />
    </FieldShell>
  );
}
