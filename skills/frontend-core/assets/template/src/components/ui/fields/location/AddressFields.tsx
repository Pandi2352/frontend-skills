import type { Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { cn } from '@/lib/cn';
import type { ControlSize } from '../base';
import { Input } from '../text/Input';
import { CitySelect, type LoadCities } from './CitySelect';
import { CountrySelect } from './CountrySelect';
import { StateSelect } from './StateSelect';

export interface Address {
  line1: string;
  line2: string;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string;
}

export const emptyAddress: Address = {
  line1: '', line2: '', country: appConfig.country, state: null, city: null, postalCode: '',
};

export interface AddressFieldsProps {
  value: Address;
  onChange: (value: Address) => void;
  onBlur?: () => void;
  /** Names become "name.line1" and so on. */
  name?: string;
  /** Message for the whole address. */
  error?: string | undefined;
  ref?: Ref<HTMLInputElement>;
  errors?: Partial<Record<keyof Address, string | undefined>>;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: ControlSize;
  loadCities?: LoadCities;
  preferredCountries?: string[];
  className?: string;
}

/** Country, state, city and postal code together. Changing one resets the next. */
export function AddressFields(props: AddressFieldsProps) {
  const {
    value, onChange, onBlur, name, error, ref, errors = {}, required = false, disabled = false,
    readOnly = false, size = 'md', loadCities, preferredCountries, className,
  } = props;
  const shared = (key: keyof Address) => ({
    name: name && `${name}.${key}`,
    error: errors[key],
    disabled,
    readOnly,
    size,
    ...(onBlur ? { onBlur: () => onBlur() } : {}),
  });
  return (
    <div className={cn('grid items-start gap-4 md:grid-cols-2', className)}>
      <Input
        {...shared('line1')}
        ref={ref}
        error={errors.line1 ?? (Object.values(errors).some(Boolean) ? undefined : error)}
        className="md:col-span-2"
        label={fieldText.address1}
        required={required}
        autoComplete="address-line1"
        value={value.line1}
        onChange={(e) => onChange({ ...value, line1: e.target.value })}
      />
      <Input
        {...shared('line2')}
        className="md:col-span-2"
        label={fieldText.address2}
        optionalText={fieldText.optional}
        autoComplete="address-line2"
        value={value.line2}
        onChange={(e) => onChange({ ...value, line2: e.target.value })}
      />
      <CountrySelect
        {...shared('country')}
        label={fieldText.country}
        required={required}
        clearable={false}
        value={value.country}
        {...(preferredCountries ? { preferred: preferredCountries } : {})}
        onChange={(country) =>
          onChange({ ...value, country, state: null, city: null, postalCode: '' })
        }
      />
      <StateSelect
        {...shared('state')}
        label={fieldText.state}
        required={required}
        country={value.country}
        value={value.state}
        onChange={(state) => onChange({ ...value, state, city: null })}
      />
      <CitySelect
        {...shared('city')}
        label={fieldText.city}
        required={required}
        country={value.country}
        state={value.state}
        value={value.city}
        {...(loadCities ? { loadCities } : {})}
        onChange={(city) => onChange({ ...value, city })}
      />
      <Input
        {...shared('postalCode')}
        label={fieldText.postalCode}
        autoComplete="postal-code"
        value={value.postalCode}
        onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
      />
    </div>
  );
}
