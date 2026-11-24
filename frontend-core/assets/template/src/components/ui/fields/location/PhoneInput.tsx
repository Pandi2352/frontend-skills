import {
  AsYouType, getCountries, getCountryCallingCode, getExampleNumber, isSupportedCountry,
  parsePhoneNumberFromString, type CountryCode,
} from 'libphonenumber-js/min';
import examples from 'libphonenumber-js/mobile/examples';
import { useMemo, useState, type Ref } from 'react';
import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { useControllableState } from '@/hooks/useControllableState';
import { countryName } from '@/lib/locations';
import {
  ControlFrame, FieldShell, HiddenInputs, innerInputClass, useField, type BaseFieldProps,
  type Option, type ValueProps,
} from '../base';
import { SelectControl } from '../select/SelectControl';

/** Use in validation rules. */
export const isValidPhone = (value: string) => !!parsePhoneNumberFromString(value)?.isValid();

export interface PhoneInputProps extends BaseFieldProps, ValueProps<string> {
  defaultCountry?: string;
  onlyCountries?: string[];
  preferredCountries?: string[];
  placeholder?: string;
  clearable?: boolean;
  onCountryChange?: (country: string) => void;
  ref?: Ref<HTMLInputElement>;
}

const asCountry = (code: string): CountryCode =>
  isSupportedCountry(code) ? code : 'US';

/** Value: E.164, e.g. "+919876543210", or "" when empty. */
export function PhoneInput(props: PhoneInputProps) {
  const { shell, aria, state, controlClassName, rest } = useField(props);
  const {
    defaultCountry = appConfig.country, onlyCountries, preferredCountries, placeholder, clearable,
    onCountryChange, onBlur, name, ref,
  } = rest;
  const [value, setValue] = useControllableState<string>({
    value: rest.value,
    defaultValue: rest.defaultValue ?? '',
    onChange: rest.onChange,
  });
  const [chosen, setChosen] = useState<CountryCode>(asCountry(defaultCountry));
  const [draft, setDraft] = useState<string | null>(null);

  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  const country = parsed?.country ?? chosen;
  const dial = getCountryCallingCode(country);
  const national = value.startsWith(`+${dial}`) ? value.slice(dial.length + 1) : value;
  const shown = draft ?? parsed?.formatNational() ?? national;

  const options = useMemo(() => {
    const list = getCountries()
      .filter((c) => !onlyCountries || onlyCountries.includes(c))
      .map((c): Option => ({
        value: c,
        badge: c,
        label: countryName(c),
        keywords: `+${getCountryCallingCode(c)} ${getCountryCallingCode(c)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, appConfig.locale));
    const first = (preferredCountries ?? []).flatMap((c) => list.find((o) => o.value === c) ?? []);
    return [...first, ...list.filter((o) => !first.includes(o))];
  }, [onlyCountries, preferredCountries]);

  const type = (text: string, from: CountryCode) => {
    const clean = text.replace(/[^\d+\s()-]/g, '');
    const typing = new AsYouType(from);
    const formatted = typing.input(clean);
    const digits = clean.replace(/\D/g, '');
    const found = typing.getCountry();
    if (found && found !== from && clean.startsWith('+')) {
      setChosen(found);
      onCountryChange?.(found);
    }
    // Only format while adding; formatting while deleting would fight the person.
    setDraft(clean.length > shown.length ? formatted : clean);
    setValue(digits ? (typing.getNumberValue() ?? `+${getCountryCallingCode(from)}${digits}`) : '');
  };

  const changeCountry = (code: string | undefined) => {
    if (!code) return;
    const next = asCountry(code);
    setChosen(next);
    onCountryChange?.(next);
    const digits = (parsed?.nationalNumber ?? national).replace(/\D/g, '');
    if (digits) {
      setDraft(null);
      setValue(`+${getCountryCallingCode(next)}${digits}`);
    }
  };

  return (
    <FieldShell shell={shell}>
      <ControlFrame
        state={state}
        className={controlClassName}
        success={!!shell.success && !state.invalid}
        onClear={
          clearable && value
            ? () => {
                setDraft(null);
                setValue('');
              }
            : undefined
        }
      >
        <SelectControl
          bare
          searchable
          aria={{
            id: `${aria.id}-country`,
            'aria-describedby': undefined,
            'aria-invalid': undefined,
            'aria-required': undefined,
          }}
          ariaLabel={fieldText.countryCode}
          state={{ ...state, loading: false }}
          options={options}
          value={[country]}
          onChange={(next) => changeCountry(next[0])}
          renderValue={(o) => (
            <span className="whitespace-nowrap">
              {o.value} <span className="text-muted">+{dial}</span>
            </span>
          )}
          renderOption={(o) => (
            <span className="flex justify-between gap-2">
              <span>{o.label}</span>
              <span className="text-muted">+{getCountryCallingCode(asCountry(o.value))}</span>
            </span>
          )}
        />
        <span aria-hidden className="h-5 border-l border-line" />
        <input
          {...aria}
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder ?? getExampleNumber(country, examples)?.formatNational()}
          disabled={state.disabled}
          readOnly={state.readOnly}
          value={shown}
          onChange={(event) => type(event.target.value, country)}
          onBlur={() => {
            setDraft(null);
            onBlur?.();
          }}
          className={innerInputClass}
        />
      </ControlFrame>
      <HiddenInputs name={name} values={value ? [value] : []} disabled={state.disabled} />
    </FieldShell>
  );
}
