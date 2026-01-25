/**
 * Market Loading
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function MarketLoading() {
  return <LoadingScreen isLoading={true} message="Loading Market Data" />;
}
