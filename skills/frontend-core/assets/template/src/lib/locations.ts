import type { Option } from '@/components/ui/fields/base';
import { appConfig } from '@/config/app.config';
import { COUNTRY_CODES } from '@/constants/countries';

export function countryName(code: string, locale = appConfig.locale) {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
}

/** Every country, sorted by name, with preferred ones first. */
export function getCountryOptions(config: { preferred?: string[]; only?: string[] } = {}): Option[] {
  const { preferred = [], only } = config;
  const options = (only ?? COUNTRY_CODES)
    .map((code): Option => ({ value: code, badge: code, label: countryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label, appConfig.locale));
  const first = preferred.flatMap((code) => options.find((o) => o.value === code) ?? []);
  return [...first, ...options.filter((o) => !preferred.includes(o.value))];
}

const cache = new Map<string, Promise<Option[]>>();

/** States or regions of a country. The data is downloaded on first use. */
export function getStateOptions(country: string): Promise<Option[]> {
  let found = cache.get(country);
  if (!found) {
    found = import('country-region-data').then(({ allCountries }) => {
      const regions = allCountries.find(([, code]) => code === country)?.[2] ?? [];
      // Some regions have no code; their name is the value then.
      return regions.map(([label, code]) => ({ value: code || label, label }));
    });
    found.catch(() => cache.delete(country));
    cache.set(country, found);
  }
  return found;
}
