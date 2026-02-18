/**
 * K-Universal Language Switcher
 * WOWPASS-style 언어 변경 드롭다운
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Change language handler
  const changeLanguage = (newLocale: Locale) => {
    // Get the path without the current locale
    const pathWithoutLocale = pathname ? pathname.replace(`/${locale}`, '') : '/';

    // Navigate to the new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xl">{localeFlags[locale]}</span>
        <span className="text-sm font-medium text-gray-700">{localeNames[locale]}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="py-2">
              {locales.map((lang) => {
                const isActive = lang === locale;
                const isSupported = ['en', 'ko'].includes(lang); // Currently supported languages

                return (
                  <motion.button
                    key={lang}
                    onClick={() => isSupported && changeLanguage(lang)}
                    disabled={!isSupported}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 transition-colors
                      ${isActive
                        ? 'bg-[#0066FF]/10 text-[#0066FF]'
                        : isSupported
                          ? 'hover:bg-gray-50 text-gray-700'
                          : 'text-gray-400 cursor-not-allowed'
                      }
                    `}
                    whileHover={isSupported && !isActive ? { x: 4 } : {}}
                  >
                    <span className="text-2xl">{localeFlags[lang]}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{localeNames[lang]}</div>
                      {!isSupported && (
                        <div className="text-xs text-gray-400">Coming Soon</div>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-[#0066FF] rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                More languages coming soon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
