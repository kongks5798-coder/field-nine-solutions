/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 60: ADMIN OBSERVABILITY PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import ObservabilityDashboard from '@/components/admin/ObservabilityDashboard';

export const metadata = {
  title: 'Observability Dashboard | Admin',
  description: 'System monitoring, health checks, and operational insights',
};

export default function ObservabilityPage() {
  return <ObservabilityDashboard />;
}
