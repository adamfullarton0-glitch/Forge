import { en, type TKey } from './en';

/** The 14 supported languages (display names). */
export const LANGS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  pl: 'Polski',
  nl: 'Nederlands',
  tr: 'Türkçe',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  ja: '日本語',
  zh: '中文',
};

/**
 * Translation tables, keyed by language. Only English is fully populated for
 * now; the other 13 land in Phase 9 and fall back to English meanwhile.
 */
const DICTS: Partial<Record<string, Partial<Record<TKey, string>>>> = { en };

export type Translate = (key: TKey) => string;

/** Builds a `t()` for the given language with an English fallback per key. */
export function translator(lang: string): Translate {
  const dict = DICTS[lang];
  return (key) => dict?.[key] ?? en[key] ?? key;
}

export type { TKey };
