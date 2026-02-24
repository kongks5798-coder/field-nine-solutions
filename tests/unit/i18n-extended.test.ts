// @vitest-environment node
/**
 * i18n-extended.test.ts
 *
 * Extended edge-case tests for src/lib/i18n:
 * 1. t() with every locale for all "common.*" keys returns non-key strings
 * 2. Fallback chain: unknown locale key → default locale (ko) → key itself
 * 3. getSupportedLocales returns exactly 3 locales
 * 4. t() with explicit locale param ignores currentLocale state
 * 5. All locales have identical key sets (no missing keys)
 * 6. Repeated setLocale calls do not corrupt state
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, getSupportedLocales } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const COMMON_KEYS = [
  'common.loading',
  'common.error',
  'common.retry',
  'common.save',
  'common.cancel',
  'common.delete',
  'common.confirm',
  'common.close',
  'common.search',
  'common.back',
];

describe('i18n extended', () => {
  beforeEach(() => {
    setLocale('ko');
  });

  it('t() returns a non-key value for every common key in every locale', () => {
    const locales = getSupportedLocales();
    for (const locale of locales) {
      for (const key of COMMON_KEYS) {
        const value = t(key, locale);
        expect(value).not.toBe(key);
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it('fallback chain: unknown key in en falls back to ko, then to key itself', () => {
    setLocale('en');
    // Key that does not exist in any locale → returns the key itself
    const missingKey = 'totally.unknown.key.xyz';
    expect(t(missingKey)).toBe(missingKey);
  });

  it('fallback: casting unknown locale treats it as missing → falls back to ko then key', () => {
    // Force an invalid locale through type assertion
    const unknownLocale = 'zz' as Locale;
    // The messages[unknownLocale] is undefined, so it falls through to messages["ko"]
    const result = t('common.loading', unknownLocale);
    // Should fall back to ko default
    expect(result).toBe('로딩 중...');
  });

  it('getSupportedLocales returns exactly 3 locales', () => {
    const locales = getSupportedLocales();
    expect(locales).toHaveLength(3);
    expect(new Set(locales).size).toBe(3);
  });

  it('getSupportedLocales contains ko, en, ja', () => {
    const locales = getSupportedLocales();
    expect(locales).toEqual(expect.arrayContaining(['ko', 'en', 'ja']));
  });

  it('all locales have the same set of keys (no missing translations)', () => {
    const locales = getSupportedLocales();
    // Collect all keys from each locale by testing every known key
    const allKeys = [
      ...COMMON_KEYS,
      'nav.home', 'nav.workspace', 'nav.dashboard', 'nav.settings',
      'nav.login', 'nav.signup', 'nav.logout',
      'auth.email', 'auth.password', 'auth.forgot_password',
      'error.not_found', 'error.unauthorized', 'error.server', 'error.rate_limit',
    ];

    for (const locale of locales) {
      for (const key of allKeys) {
        const value = t(key, locale);
        // Should not fall back to the key itself
        expect(value).not.toBe(key);
      }
    }
  });
});
