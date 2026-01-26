'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 53: PROPHET TRADING PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 삼각 아비트라지 트레이딩 대시보드
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Suspense } from 'react';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import { ProphetCommandCenter } from '@/components/nexus/prophet-command-center';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔮</div>
        <div className="text-gray-500">Prophet Engine 초기화 중...</div>
      </div>
    </div>
  );
}

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Prophet Trading" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <ProphetCommandCenter />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
