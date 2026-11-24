import type { Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import type { Option } from '../base';
import { Combobox } from '../select/Dropdown';
import { TextFallback, type PlaceProps } from './TextFallback';

export type LoadCities = (
  query: { country: string; state: string | null; text: string },
  signal: AbortSignal,
) => Promise<Option[]>;

export interface CitySelectProps extends PlaceProps {
  country: string | null;
  state: string | null;
  /**
   * Searches cities on your server. World city data is too large to ship in a
   * browser bundle, so without this the field is a plain text box.
   */
  loadCities?: LoadCities;
}

export function CitySelect(props: CitySelectProps) {
  const { country, state, loadCities, value, onChange, onBlur, ref, ...rest } = props;
  if (!loadCities) {
    return (
      <TextFallback {...rest} ref={ref} value={value ?? null} onChange={onChange} onBlur={onBlur} autoComplete="address-level2" />
    );
  }
  return (
    <Combobox
      {...rest}
      key={`${country}-${state}`}
      ref={ref as Ref<HTMLButtonElement>}
      value={value ?? null}
      onChange={onChange}
      onBlur={onBlur}
      disabled={rest.disabled || !country}
      placeholder={country ? (rest.placeholder ?? fieldText.select) : fieldText.chooseCountryFirst}
      loadOptions={(text, signal) =>
        country ? loadCities({ country, state, text }, signal) : Promise.resolve([])
      }
    />
  );
}
