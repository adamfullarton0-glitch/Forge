import { en, type TKey } from './en';
import { DICTS as TRANSLATIONS } from './translations';

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
 * Translation tables, keyed by language. English is the full base; the other
 * 13 are partial and fall back to English per key via the translator. Exercise
 * steps and recipe text intentionally stay in English.
 */
const DICTS: Partial<Record<string, Partial<Record<TKey, string>>>> = { en, ...TRANSLATIONS };

export type Translate = (key: TKey) => string;

/** Builds a `t()` for the given language with an English fallback per key. */
export function translator(lang: string): Translate {
  const dict = DICTS[lang];
  return (key) => dict?.[key] ?? en[key] ?? key;
}

export type { TKey };
