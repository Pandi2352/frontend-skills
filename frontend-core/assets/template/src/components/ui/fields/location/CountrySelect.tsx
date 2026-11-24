import { useMemo } from 'react';
import { getCountryOptions } from '@/lib/locations';
import { Combobox, MultiDropdown, type DropdownProps, type MultiDropdownProps } from '../select/Dropdown';

interface CountryList {
  /** Shown at the top. */
  preferred?: string[];
  /** Limits the list. */
  only?: string[];
}

export type CountrySelectProps = Omit<DropdownProps, 'options'> & CountryList;

/** All 249 countries. Value: ISO code, e.g. "IN". */
export function CountrySelect({ preferred, only, ...props }: CountrySelectProps) {
  const options = useMemo(
    () => getCountryOptions({ ...(preferred ? { preferred } : {}), ...(only ? { only } : {}) }),
    [preferred, only],
  );
  return <Combobox {...props} options={options} />;
}

/** Several countries. Value: ["IN", "US"]. */
export function CountryMultiSelect({
  preferred, only, ...props
}: Omit<MultiDropdownProps, 'options'> & CountryList) {
  const options = useMemo(
    () => getCountryOptions({ ...(preferred ? { preferred } : {}), ...(only ? { only } : {}) }),
    [preferred, only],
  );
  return <MultiDropdown searchable clearable {...props} options={options} />;
}
