/**
 * Membership Loading
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function MembershipLoading() {
  return <LoadingScreen isLoading={true} message="Loading Membership" />;
}
