/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS ENERGY DASHBOARD PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 36: AI Energy Trading Dashboard
 * Tesla Fleet Integration + SMP Price Monitoring + V2G Profit Estimation
 *
 * @route /nexus/energy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EnergyDashboard } from '@/components/nexus/energy-dashboard';

export const metadata = {
  title: 'Energy Dashboard | Field Nine NEXUS',
  description: 'AI-Powered Energy Trading & Tesla Fleet Management',
};

export default function EnergyDashboardPage() {
  return <EnergyDashboard />;
}
