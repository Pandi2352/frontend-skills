import type { Ref } from 'react';
import type { DropdownProps } from '../select/Dropdown';
import { Input } from '../text/Input';

export interface PlaceProps
  extends Omit<DropdownProps, 'options' | 'loadOptions' | 'onCreate' | 'defaultValue' | 'ref'> {
  ref?: Ref<HTMLButtonElement | HTMLInputElement>;
}

/** Text box used when there is no list to choose from. Looks like the dropdown. */
export function TextFallback(props: PlaceProps & { autoComplete: string }) {
  const {
    value, onChange, onBlur, ref, searchable: _s, selectedOptions: _o, emptyText: _e,
    renderOption: _r, renderValue: _v, maxVisible: _m, placeholder: _p, ...base
  } = props;
  return (
    <Input
      {...base}
      ref={ref as Ref<HTMLInputElement>}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value || null)}
      onBlur={() => onBlur?.()}
    />
  );
}
