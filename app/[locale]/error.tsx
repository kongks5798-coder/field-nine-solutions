/**
 * PHASE 77: Global Error Page
 * Elegant error handling with energy network theme
 */

'use client';

import { EnergyErrorPage } from '@/components/nexus/smart-error-handling';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <EnergyErrorPage error={error} reset={reset} />;
}
