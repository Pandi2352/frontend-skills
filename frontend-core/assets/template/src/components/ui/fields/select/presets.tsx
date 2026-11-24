import { useMemo } from 'react';
import { appConfig } from '@/config/app.config';
import type { Option } from '../base';
import { Combobox, type DropdownProps } from './Dropdown';

type PresetProps = Omit<DropdownProps, 'options' | 'loadOptions' | 'onCreate'>;

const displayName = (type: Intl.DisplayNamesType, code: string) => {
  try {
    return new Intl.DisplayNames([appConfig.locale], { type }).of(code) ?? code;
  } catch {
    return code;
  }
};

// Browsers still list some zones under old names.
const RENAMED: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Europe/Kiev': 'Europe/Kyiv',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'America/Godthab': 'America/Nuuk',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Louisville': 'America/Kentucky/Louisville',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Truk': 'Pacific/Chuuk',
};

export function getTimezones(): { zone: string; oldName: string }[] {
  const found = new Map<string, string>([['UTC', '']]);
  for (const name of Intl.supportedValuesOf('timeZone')) {
    found.set(RENAMED[name] ?? name, RENAMED[name] ? name : '');
  }
  return [...found]
    .map(([zone, oldName]) => ({ zone, oldName }))
    .sort((a, b) => a.zone.localeCompare(b.zone));
}

/** Value: IANA zone, e.g. "Asia/Kolkata". */
export function TimezoneSelect(props: PresetProps) {
  const options = useMemo(
    () =>
      getTimezones().map(({ zone, oldName }): Option => {
        const offset = new Intl.DateTimeFormat('en-US', { timeZone: oldName || zone, timeZoneName: 'shortOffset' })
          .formatToParts(new Date())
          .find((p) => p.type === 'timeZoneName')?.value;
        return {
          value: zone,
          label: zone.replaceAll('_', ' '),
          ...(offset ? { description: offset } : {}),
          keywords: `${offset ?? ''} ${oldName}`,
        };
      }),
    [],
  );
  return <Combobox maxVisible={500} {...props} options={options} />;
}

/** Value: ISO 4217, e.g. "INR". */
export function CurrencySelect(props: PresetProps) {
  const options = useMemo(
    () =>
      Intl.supportedValuesOf('currency').map(
        (code): Option => ({ value: code, badge: code, label: displayName('currency', code) }),
      ),
    [],
  );
  return <Combobox {...props} options={options} />;
}

const LANGUAGES =
  'ar bg bn ca cs da de el en es et fa fi fr gu he hi hr hu id it ja kn ko lt lv ml mr ms nb nl pa pl pt ro ru sk sl sr sv sw ta te th tr uk ur vi zh'.split(' ');

/** Value: BCP 47 language, e.g. "ta". Pass `codes` to limit the list. */
export function LanguageSelect({ codes = LANGUAGES, ...props }: PresetProps & { codes?: string[] }) {
  const options = useMemo(
    () => codes.map((code): Option => ({ value: code, badge: code, label: displayName('language', code) })),
    [codes],
  );
  return <Combobox {...props} options={options} />;
}
