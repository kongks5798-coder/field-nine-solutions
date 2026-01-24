/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS ENERGY DASHBOARD PAGE - THE FINAL CONVERGENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 37: THE FINAL CONVERGENCE
 *
 * Kaus Coin Financial Integration + AI Trading + T2E Bridge
 * "에너지는 숫자가 아니라 돈이다. 제국의 위용을 숫자로 증명하라."
 *
 * @route /nexus/energy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ConvergenceDashboard } from '@/components/nexus/convergence-dashboard';

export const metadata = {
  title: 'NEXUS Energy | Field Nine OS',
  description: 'Phase 37: The Final Convergence - Kaus Coin, AI Trading, T2E Bridge',
};

export default function EnergyDashboardPage() {
  return <ConvergenceDashboard />;
}
