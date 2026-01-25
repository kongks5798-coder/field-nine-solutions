/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS LOADING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Next.js 자동 로딩 상태 표시
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function NexusLoading() {
  return <LoadingScreen isLoading={true} message="Loading NEXUS" />;
}
