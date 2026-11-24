import { useEffect, useState, type Ref } from 'react';
import { fieldText } from '@/constants/field-text';
import { getStateOptions } from '@/lib/locations';
import type { Option } from '../base';
import { Combobox } from '../select/Dropdown';
import { TextFallback, type PlaceProps } from './TextFallback';

export interface StateSelectProps extends PlaceProps {
  /** ISO country code. Clear the value when this changes. */
  country: string | null;
}

/**
 * States of the chosen country. Value: region code ("TN"), or its name when the
 * data has no code. Becomes a text box if the list is missing or fails.
 */
export function StateSelect(props: StateSelectProps) {
  const { country, value, onChange, ref, onBlur, ...rest } = props;
  const [loaded, setLoaded] = useState<{ country: string; options: Option[] }>();

  useEffect(() => {
    if (!country) return;
    let stale = false;
    getStateOptions(country)
      .catch(() => [])
      .then((options) => {
        if (!stale) setLoaded({ country, options });
      });
    return () => {
      stale = true;
    };
  }, [country]);

  const ready = loaded?.country === country;
  if (country && ready && loaded.options.length === 0) {
    return (
      <TextFallback {...rest} ref={ref} value={value ?? null} onChange={onChange} onBlur={onBlur} autoComplete="address-level1" />
    );
  }
  return (
    <Combobox
      {...rest}
      ref={ref as Ref<HTMLButtonElement>}
      value={value ?? null}
      onChange={onChange}
      onBlur={onBlur}
      disabled={rest.disabled || !country}
      loading={!!rest.loading || (!!country && !ready)}
      placeholder={country ? (rest.placeholder ?? fieldText.select) : fieldText.chooseCountryFirst}
      options={ready ? loaded.options : []}
    />
  );
}
