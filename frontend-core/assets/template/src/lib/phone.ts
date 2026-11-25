import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

/**
 * Loads the phone data at once (about 40 kB). In forms use `phoneRule` from the
 * fields instead; it loads the data only when needed.
 */
export const isValidPhone = (value: string) => !!parsePhoneNumberFromString(value)?.isValid();
