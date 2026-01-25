/**
 * Profile Loading
 */

'use client';

import { LoadingScreen } from '@/components/nexus/loading-screen';

export default function ProfileLoading() {
  return <LoadingScreen isLoading={true} message="Loading Profile" />;
}
