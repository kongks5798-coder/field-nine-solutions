/**
 * K-Universal / Field Nine OS Routing Configuration
 * Used by next-intl middleware
 */

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Supported locales
  locales: ['ko', 'en', 'ja', 'zh'],

  // Default locale (Korean - K-Universal brand)
  defaultLocale: 'ko',

  // Locale prefix strategy
  localePrefix: 'always',
});

// Create navigation utilities
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
