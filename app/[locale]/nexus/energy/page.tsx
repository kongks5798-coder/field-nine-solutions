/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEXUS ENERGY DASHBOARD - PHASE 67: ENHANCED MOBILE OPTIMIZATION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla Fleet API + Yeongdong Weather + Sovereign CTA
 * 모바일 반응형 강화
 *
 * @route /nexus/energy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';
import { SovereignCTA } from '@/components/nexus/sovereign-cta';
import { LiveEnergyMixWidget } from '@/components/nexus/energy-mix-widget';
import { AutoTraderWidget } from '@/components/nexus/yield-farming';
import {
  TeslaCoreWidget,
} from '@/components/nexus/phase38-dashboard';
import {
  EmpireLinkWidget,
  YeongdongAssetWidget,
  ProphetAISalesWidget,
} from '@/components/nexus/phase40-viral';
import { CompactGlobeIndicator } from '@/components/nexus/globe-widget';
import { WealthDashboard } from '@/components/nexus/wealth-dashboard';

interface TeslaLiveData {
  batteryLevel: number;
  energyStored: number;
  v2gAvailable: number;
  v2gStatus: 'ACTIVE' | 'CHARGING' | 'STANDBY' | 'DISCHARGING';
  isLive: boolean;
}

interface YeongdongLiveData {
  currentOutput: number;
  dailyGeneration: number;
  todayEarningsKRW: number;
  todayEarningsUSD: number;
  smpPrice: number;
  weatherCondition: string;
  isLive: boolean;
}

export default function EnergyDashboardPage() {
  const [teslaData, setTeslaData] = useState<TeslaLiveData | null>(null);
  const [yeongdongData, setYeongdongData] = useState<YeongdongLiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [teslaRes, yeongdongRes] = await Promise.all([
          fetch('/api/live/tesla').catch(() => null),
          fetch('/api/live/yeongdong').catch(() => null),
        ]);

        if (teslaRes?.ok) {
          const data = await teslaRes.json();
          setTeslaData(data);
        } else {
          setTeslaData({
            batteryLevel: 72,
            energyStored: 75.6,
            v2gAvailable: 54.6,
            v2gStatus: 'ACTIVE',
            isLive: false,
          });
        }

        if (yeongdongRes?.ok) {
          const data = await yeongdongRes.json();
          setYeongdongData(data);
        } else {
          const hour = new Date().getHours();
          const sunFactor = hour >= 6 && hour <= 18 ? Math.sin((hour - 6) / 12 * Math.PI) : 0;
          setYeongdongData({
            currentOutput: Math.round(50 * sunFactor * 0.85),
            dailyGeneration: 212,
            todayEarningsKRW: 27560000,
            todayEarningsUSD: 20878,
            smpPrice: 130,
            weatherCondition: 'sunny',
            isLive: false,
          });
        }
      } catch {
        console.log('[Live Data] Using fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Desktop: Financial Terminal Sidebar */}
      <div className="hidden md:block">
        <FinancialSidebar />
      </div>

      {/* Mobile: Header */}
      <div className="md:hidden">
        <MobileHeader title="Energy Command" />
      </div>

      <div className="md:ml-56">
        {/* Desktop Only */}
        <div className="hidden md:block">
          <PriceTicker />
          <MembershipBar />
        </div>

        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
            {/* Live Status Header - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-[#171717]">Energy Command Center</h1>
                <p className="text-xs md:text-sm text-[#171717]/60">실시간 자산 모니터링</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:block">
                  <CompactGlobeIndicator />
                </div>
                <div className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full ${
                  teslaData?.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full animate-pulse ${
                    teslaData?.isLive ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-[10px] md:text-xs font-bold">
                    {teslaData?.isLive ? 'LIVE' : 'SIMULATED'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* AI Auto-Trader - Phase 47 */}
            <AutoTraderWidget />

            {/* Live Energy Mix - Phase 46 */}
            <LiveEnergyMixWidget />

            {/* Hero CTA - Central */}
            <SovereignCTA variant="hero" showBenefits={true} />

            {/* Live Data Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tesla Cybertruck Live */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#171717] rounded-2xl p-4 md:p-6 text-white"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                      <span className="text-xl md:text-2xl">🚗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base">Tesla Cybertruck</h3>
                      <p className="text-[10px] md:text-xs text-white/50">V2G Energy Unit</p>
                    </div>
                  </div>
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                    teslaData?.v2gStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    teslaData?.v2gStatus === 'CHARGING' ? 'bg-cyan-500/20 text-cyan-400' :
                    teslaData?.v2gStatus === 'DISCHARGING' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {teslaData?.v2gStatus || 'LOADING'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="bg-white/5 rounded-xl p-3 md:p-4">
                    <div className="text-[10px] md:text-xs text-white/50 mb-1">Battery</div>
                    <div className="text-2xl md:text-3xl font-black text-emerald-400">
                      {loading ? '—' : `${teslaData?.batteryLevel}%`}
                    </div>
                    <div className="mt-2 h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${teslaData?.batteryLevel || 0}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 md:p-4">
                    <div className="text-[10px] md:text-xs text-white/50 mb-1">V2G Available</div>
                    <div className="text-2xl md:text-3xl font-black text-cyan-400">
                      {loading ? '—' : `${teslaData?.v2gAvailable.toFixed(1)}`}
                      <span className="text-sm md:text-lg ml-1">kWh</span>
                    </div>
                    <div className="text-[10px] md:text-xs text-white/40 mt-1">
                      of {teslaData?.energyStored.toFixed(1)} kWh
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Yeongdong Solar Live */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-2xl p-4 md:p-6 text-white"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl md:text-2xl">☀️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base">Yeongdong Solar</h3>
                      <p className="text-[10px] md:text-xs text-white/50">100,000평 태양광</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] md:text-xs text-white/50">Weather</div>
                    <div className="text-base md:text-lg">
                      {yeongdongData?.weatherCondition === 'sunny' ? '☀️' :
                       yeongdongData?.weatherCondition === 'cloudy' ? '☁️' :
                       yeongdongData?.weatherCondition === 'partly_cloudy' ? '⛅' : '🌧️'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3 md:p-4">
                    <div className="text-[10px] md:text-xs text-white/50 mb-1">Current Output</div>
                    <div className="text-2xl md:text-3xl font-black text-amber-400">
                      {loading ? '—' : `${yeongdongData?.currentOutput}`}
                      <span className="text-sm md:text-lg ml-1">MW</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] md:text-xs text-emerald-400">LIVE</span>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3 md:p-4">
                    <div className="text-[10px] md:text-xs text-white/50 mb-1">Today&apos;s Earnings</div>
                    <div className="text-xl md:text-2xl font-black text-emerald-400">
                      {loading ? '—' : `₩${(yeongdongData?.todayEarningsKRW || 0).toLocaleString()}`}
                    </div>
                    <div className="text-[10px] md:text-xs text-white/40 mt-1">
                      ${yeongdongData?.todayEarningsUSD.toLocaleString()} USD
                    </div>
                  </div>
                </div>

                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10 flex items-center justify-between text-xs md:text-sm">
                  <div>
                    <span className="text-white/50">Daily:</span>
                    <span className="font-bold ml-1 md:ml-2">{yeongdongData?.dailyGeneration} MWh</span>
                  </div>
                  <div>
                    <span className="text-white/50">SMP:</span>
                    <span className="font-bold text-cyan-400 ml-1 md:ml-2">₩{yeongdongData?.smpPrice}/kWh</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Tesla Core Widget */}
            <TeslaCoreWidget />

            {/* Empire Link Referral */}
            <EmpireLinkWidget />

            {/* Yeongdong Asset View */}
            <YeongdongAssetWidget />

            {/* Prophet AI Sales */}
            <ProphetAISalesWidget />

            {/* Phase 52: AI Governance & Wealth Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <WealthDashboard />
            </motion.div>

            {/* Floating CTA for non-members */}
            <SovereignCTA variant="floating" />
          </div>
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
