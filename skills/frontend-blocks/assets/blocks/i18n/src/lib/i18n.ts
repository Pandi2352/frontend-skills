import { appConfig } from '@/config/app.config';
import { fieldText } from '@/constants/field-text';
import { uiText } from '@/constants/ui-text';
import { en, type Messages } from '@/locales/en';

type Loader = () => Promise<{ messages: Messages; ui?: Partial<typeof uiText>; fields?: Partial<typeof fieldText> }>;

interface Language {
  label: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  /** Loaded only when chosen. Not for English, which is always there. */
  load?: Loader;
}

// Add a language: one line here and one file in src/locales.
export const LANGUAGES = {
  en: { label: 'English', locale: 'en-US', dir: 'ltr' },
  ar: { label: 'العربية', locale: 'ar-EG', dir: 'rtl', load: () => import('@/locales/ar') },
} satisfies Record<string, Language>;

export type LanguageCode = keyof typeof LANGUAGES;
const languages: Record<LanguageCode, Language> = LANGUAGES;
const KEY = 'language';

const isLanguage = (code: string | null | undefined): code is LanguageCode => !!code && Object.hasOwn(LANGUAGES, code);

/** Chosen before, else the first browser language we have, else English. */
export function detectLanguage(): LanguageCode {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    // Storage can be blocked.
  }
  if (isLanguage(saved)) return saved;
  return navigator.languages.map((l) => l.split('-')[0]).find(isLanguage) ?? 'en';
}

let current: LanguageCode = 'en';
let messages: Messages = en;
let plurals = new Intl.PluralRules('en-US');

export const getLanguage = () => current;

/** Call before the first render: `await startI18n(); createRoot(...)`. Falls back to English when a file cannot be loaded. */
export async function startI18n(code: LanguageCode = detectLanguage()) {
  const language = languages[code];
  try {
    const loaded = await language.load?.();
    if (loaded) {
      messages = loaded.messages;
      // The words inside shared components.
      Object.assign(uiText, loaded.ui);
      Object.assign(fieldText, loaded.fields);
    }
    current = code;
  } catch {
    current = 'en';
  }
  const { locale, dir } = languages[current];
  plurals = new Intl.PluralRules(locale);
  appConfig.locale = locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;
}

/** Saves and reloads, so every text, number, date and direction changes together. */
export function changeLanguage(code: LanguageCode, reload: () => void = () => location.reload()) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // The choice is then kept only for this visit.
  }
  reload();
}

type Plural = { one?: string; other: string; zero?: string; two?: string; few?: string; many?: string };
export type MessageTree = { [key: string]: string | Plural | MessageTree };
type Join<K extends string, P> = P extends string ? `${K}.${P}` : never;
type Keys<T> = {
  [K in keyof T & string]: T[K] extends string | Plural ? K : Join<K, Keys<T[K]>>;
}[keyof T & string];
export type MessageKey = Keys<Messages>;

/** `t('users.title')`, `t('users.count', { count: 3 })`. Keys are checked by TypeScript. */
export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  let found: unknown = messages;
  for (const part of key.split('.')) found = (found as Record<string, unknown> | undefined)?.[part];
  if (found && typeof found === 'object' && 'other' in found) {
    const forms = found as Plural;
    found = forms[plurals.select(Number(values.count ?? 0))] ?? forms.other;
  }
  if (typeof found !== 'string') return key;
  return found.replace(/\{(\w+)\}/g, (all, name: string) => {
    const value = values[name];
    if (value === undefined) return all;
    return typeof value === 'number' ? new Intl.NumberFormat(appConfig.locale).format(value) : value;
  });
}
