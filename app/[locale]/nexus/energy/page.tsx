/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS ENERGY DASHBOARD PAGE - PHASE 38 THE FINAL ASCENSION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 38: THE FINAL ASCENSION
 *
 * Kaus Coin Financial Integration + Tesla Core + Prophet AI
 * "에너지는 숫자가 아니라 돈이다. 제국의 위용을 숫자로 증명하라."
 *
 * @route /nexus/energy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConvergenceDashboard } from '@/components/nexus/convergence-dashboard';
import {
  TeslaCoreWidget,
  KausHeaderWidget,
  ProphetAIWidget,
  VisitorAnalyticsWidget,
} from '@/components/nexus/phase38-dashboard';

export default function EnergyDashboardPage() {
  const router = useRouter();
  const [teslaStatus, setTeslaStatus] = useState<'loading' | 'live' | 'error'>('loading');

  useEffect(() => {
    // Check Tesla authentication
    fetch('/api/auth/tesla/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'LIVE') {
          setTeslaStatus('live');
        } else if (data.status === 'NOT_AUTHENTICATED') {
          // Redirect to Tesla login
          router.push('/api/auth/tesla/login');
        } else {
          setTeslaStatus('error');
        }
      })
      .catch(() => setTeslaStatus('error'));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Phase 38 Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7]/95 backdrop-blur-xl border-b border-[#171717]/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#171717] rounded-lg flex items-center justify-center">
              <span className="text-[#F9F9F7] font-black text-sm">F9</span>
            </div>
            <div>
              <div className="text-lg font-bold text-[#171717]">NEXUS ENERGY</div>
              <div className="text-[10px] text-[#171717]/40 tracking-widest">COMMAND CENTER</div>
            </div>
          </div>

          {/* Kaus Coin Balance - Right side */}
          <div className="flex items-center gap-4">
            <KausHeaderWidget />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                teslaStatus === 'live' ? 'bg-emerald-500' :
                teslaStatus === 'error' ? 'bg-amber-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-[#171717]/60">
                {teslaStatus === 'live' ? 'LIVE' : teslaStatus === 'error' ? 'STANDBY' : 'SYNCING'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Visitor Analytics */}
          <VisitorAnalyticsWidget />

          {/* Tesla Core Widget - Central */}
          <TeslaCoreWidget />

          {/* Original Convergence Dashboard */}
          <ConvergenceDashboard />

          {/* Prophet AI Widget - Bottom */}
          <ProphetAIWidget />
        </div>
      </main>
    </div>
  );
}
