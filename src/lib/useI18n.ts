"use client";

import { useState, useEffect, useCallback } from "react";
import { t as translate, getLocale, setLocale as setGlobalLocale, type Locale } from "./i18n";

/** React hook for i18n with automatic re-render on locale change */
export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale);

  useEffect(() => {
    // Sync with any external changes
    const stored = getLocale();
    if (stored !== locale) setLocaleState(stored);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback((newLocale: Locale) => {
    setGlobalLocale(newLocale);
    setLocaleState(newLocale);
    // Update html lang attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string) => translate(key, locale), [locale]);

  return { t, locale, setLocale };
}
