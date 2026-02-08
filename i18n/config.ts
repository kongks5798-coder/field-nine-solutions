/**
 * K-Universal i18n Configuration
 * 한국어 우선 정책 - 메인 타겟: 한국 시장
 */

export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export type Locale = (typeof locales)[number];

// 🇰🇷 한국어가 기본 언어 (K-Universal 브랜드 아이덴티티)
export const defaultLocale: Locale = 'ko';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ko: '🇰🇷',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

// Languages currently fully supported (others show English fallback)
export const supportedLocales: Locale[] = ['en', 'ko'];

// Check if a locale is fully supported
export function isFullySupported(locale: Locale): boolean {
  return supportedLocales.includes(locale);
}
