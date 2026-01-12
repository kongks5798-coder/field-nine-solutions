/**
 * K-Universal App Providers
 * Analytics and monitoring initialization
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initSentry } from '@/lib/monitoring/sentry';
import * as ga from '@/lib/analytics/google-analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Sentry
    initSentry();
  }, []);

  useEffect(() => {
    // Track page views
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      ga.pageview(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
