/**
 * K-Universal App Providers
 * Analytics, monitoring, currency, and travel search initialization
 */

'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initSentry } from '@/lib/monitoring/sentry';
import * as ga from '@/lib/analytics/google-analytics';
import { CurrencyProvider } from '@/contexts/currency-context';
import { TravelSearchProvider } from '@/contexts/travel-search-context';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      ga.pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Sentry
    initSentry();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  );
}

/**
 * K-Universal Provider Stack
 * Wraps the app with all necessary context providers
 */
export function KUniversalProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Sentry
    initSentry();
  }, []);

  return (
    <CurrencyProvider defaultCurrency="KRW">
      <TravelSearchProvider>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </TravelSearchProvider>
    </CurrencyProvider>
  );
}
