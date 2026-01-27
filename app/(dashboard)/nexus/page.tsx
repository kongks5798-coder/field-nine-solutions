/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 55: NEXUS ENERGY DASHBOARD PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import NexusEnergyDashboard from '@/components/nexus/NexusEnergyDashboard';

export const metadata = {
  title: 'NEXUS Energy | Field Nine',
  description: '영동 태양광 발전소 실시간 모니터링 및 에너지 오더북',
};

export default function NexusPage() {
  return <NexusEnergyDashboard />;
}
