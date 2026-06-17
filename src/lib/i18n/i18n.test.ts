import { describe, it, expect } from 'vitest';
import { translator, LANGS } from './index';
import { en } from './en';
import { DICTS } from './translations';

describe('i18n', () => {
  it('lists 14 languages', () => {
    expect(Object.keys(LANGS)).toHaveLength(14);
    expect(LANGS.en).toBe('English');
  });

  it('translates known keys per language', () => {
    expect(translator('es')('home')).toBe('Inicio');
    expect(translator('fr')('eat')).toBe('Manger');
    expect(translator('ja')('settings')).toBe('設定');
  });

  it('falls back to English for a key a language omits', () => {
    // chefTip is a newer key not present in the ported dictionaries.
    expect(translator('es')('chefTip')).toBe(en.chefTip);
  });

  it('falls back to English for an unknown language', () => {
    expect(translator('xx')('home')).toBe('Home');
  });

  it('returns the key itself if it is missing everywhere (defensive)', () => {
    // @ts-expect-error intentionally passing a non-key
    expect(translator('en')('totally-made-up')).toBe('totally-made-up');
  });

  it('every translation value is a non-empty string', () => {
    for (const [lang, dict] of Object.entries(DICTS)) {
      for (const [key, value] of Object.entries(dict ?? {})) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect((value ?? '').length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
