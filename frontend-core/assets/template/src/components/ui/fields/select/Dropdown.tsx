import type { Ref } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { FieldShell, useField, type BaseFieldProps, type ValueProps } from '../base';
import { SelectControl, type SelectFeatures } from './SelectControl';

export interface DropdownProps<T extends string | number = string>
  extends BaseFieldProps,
    SelectFeatures<T>,
    ValueProps<T | null> {
  ref?: Ref<HTMLButtonElement>;
}

/** Pick one. Replaces `<select>`. */
export function Dropdown<T extends string | number = string>(props: DropdownProps<T>) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const { value, defaultValue, onChange, ...select } = rest;
  const [current, setCurrent] = useControllableState<T | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  });
  return (
    <FieldShell shell={shell}>
      <SelectControl<T>
        {...select}
        aria={aria}
        state={state}
        labelId={labelId}
        className={controlClassName}
        value={current === null ? [] : [current]}
        onChange={(next) => setCurrent(next[0] ?? null)}
      />
    </FieldShell>
  );
}

/** Dropdown with a search box. Add `loadOptions` for server search. */
export function Combobox<T extends string | number = string>(props: DropdownProps<T>) {
  return <Dropdown searchable clearable {...props} />;
}

export interface MultiDropdownProps<T extends string | number = string>
  extends BaseFieldProps,
    SelectFeatures<T>,
    ValueProps<T[]> {
  selectAll?: boolean;
  max?: number;
  /** Chips shown before "+N more". */
  maxChips?: number;
  ref?: Ref<HTMLButtonElement>;
}

/** Pick several, shown as removable chips. */
export function MultiDropdown<T extends string | number = string>(props: MultiDropdownProps<T>) {
  const { shell, aria, state, labelId, controlClassName, rest } = useField(props);
  const { value, defaultValue, onChange, ...select } = rest;
  const [current, setCurrent] = useControllableState<T[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  return (
    <FieldShell
      shell={shell}
      count={select.max === undefined ? undefined : { current: current.length, max: select.max }}
    >
      <SelectControl<T>
        {...select}
        multiple
        aria={aria}
        state={state}
        labelId={labelId}
        className={controlClassName}
        value={current}
        onChange={setCurrent}
      />
    </FieldShell>
  );
}
