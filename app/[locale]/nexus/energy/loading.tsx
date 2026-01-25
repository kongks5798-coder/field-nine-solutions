/**
 * Energy Dashboard Loading
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function EnergyLoading() {
  return <LoadingScreen isLoading={true} message="Loading Energy Data" />;
}
