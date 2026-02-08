/**
 * Exchange Loading
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function ExchangeLoading() {
  return <LoadingScreen isLoading={true} message="Loading Exchange" />;
}
