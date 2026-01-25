/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 49: GLOBAL ASSETS - Infrastructure Assetization
 * ═══════════════════════════════════════════════════════════════════════════════
 * "제국은 국경 없는 에너지 자산으로 증명한다"
 *
 * Features:
 * - Global Profit Index (Prophet AI 24h)
 * - Sovereign Infrastructure Share Investment
 * - 3D Globe with Real-Time Energy Flow
 * - Tesla-style Minimalist Design
 *
 * @route /nexus/assets
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FinancialSidebar, PriceTicker, MembershipBar } from '@/components/nexus/financial-terminal';
import { GlobeWidget } from '@/components/nexus/globe-widget';
import { GlobalProfitIndex, SovereignInfrastructureShare } from '@/components/nexus/global-assets-widgets';
import { PhysicalAssetBadge } from '@/components/nexus/yield-farming';
import { getYeongdongAssetValuation, AssetValuation } from '@/lib/ai/autotrader';

export default function GlobalAssetsPage() {
  const [assetValuation, setAssetValuation] = useState<AssetValuation | null>(null);
  const [networkStats, setNetworkStats] = useState({
    totalValue: 778000000,
    dailyVolume: 2800000,
    activeNodes: 19,
    avgApy: 13.2,
  });

  useEffect(() => {
    const updateData = () => {
      setAssetValuation(getYeongdongAssetValuation());

      // Simulate real-time network stats
      setNetworkStats(prev => ({
        ...prev,
        dailyVolume: 2500000 + Math.floor(Math.random() * 600000),
        avgApy: 12.8 + Math.random() * 0.8,
      }));
    };

    updateData();
    const interval = setInterval(updateData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const chartData = assetValuation?.historicalValues || [];
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <FinancialSidebar />
      <div className="ml-56">
        <PriceTicker />
        <MembershipBar />

        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold text-[#171717]"
                >
                  Global Assets
                </motion.h1>
                <p className="text-sm text-[#171717]/60">
                  Sovereign Infrastructure Network
                </p>
              </div>

              {/* Network Value Badge */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3"
              >
                <div className="text-right">
                  <div className="text-xs text-[#171717]/50">Total Network Value</div>
                  <div className="text-2xl font-black text-[#171717]">
                    ${(networkStats.totalValue / 1000000).toFixed(0)}M+
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-bold text-sm">Verified RWA</span>
                </div>
              </motion.div>
            </div>

            {/* Global Profit Index - Main Billboard */}
            <div className="mb-8">
              <GlobalProfitIndex />
            </div>

            {/* Network Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white rounded-xl p-4 border border-[#171717]/5 text-center">
                <div className="text-xs text-[#171717]/50 uppercase">Active Nodes</div>
                <div className="text-2xl font-black text-[#171717]">{networkStats.activeNodes}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#171717]/5 text-center">
                <div className="text-xs text-[#171717]/50 uppercase">Daily Volume</div>
                <div className="text-2xl font-black text-emerald-600">
                  ${(networkStats.dailyVolume / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#171717]/5 text-center">
                <div className="text-xs text-[#171717]/50 uppercase">Avg APY</div>
                <div className="text-2xl font-black text-amber-600">{networkStats.avgApy.toFixed(1)}%</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#171717]/5 text-center">
                <div className="text-xs text-[#171717]/50 uppercase">Countries</div>
                <div className="text-2xl font-black text-cyan-600">12</div>
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 3D Globe - Energy Flow Visualization */}
              <div>
                <GlobeWidget />
              </div>

              {/* Asset Value Chart */}
              {assetValuation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border border-[#171717]/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#171717]">Network Asset Value</h3>
                      <p className="text-xs text-[#171717]/50">Real-Time Valuation</p>
                    </div>
                    <div className="text-right">
                      <motion.div
                        key={assetValuation.currentValue}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-black text-[#171717]"
                      >
                        ${(assetValuation.currentValue / 1000000).toFixed(2)}M
                      </motion.div>
                      <div className={`text-sm font-bold ${
                        assetValuation.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {assetValuation.change24h >= 0 ? '+' : ''}{assetValuation.change24h.toFixed(2)}% (24h)
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-32 flex items-end gap-0.5 mb-4">
                    {chartData.map((point, i) => {
                      const height = ((point.value - minValue) / valueRange) * 100;
                      const isUp = i > 0 && point.value >= chartData[i - 1].value;
                      const isLast = i === chartData.length - 1;

                      return (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: i * 0.015 }}
                          className={`flex-1 rounded-t transition-all ${
                            isLast
                              ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                              : isUp
                              ? 'bg-emerald-500'
                              : 'bg-red-400'
                          }`}
                          style={{ minHeight: '4px' }}
                        />
                      );
                    })}
                  </div>

                  {/* Period Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#171717]/10">
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">7d</div>
                      <div className={`font-bold ${assetValuation.change7d >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {assetValuation.change7d >= 0 ? '+' : ''}{assetValuation.change7d.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">30d</div>
                      <div className={`font-bold ${assetValuation.change30d >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {assetValuation.change30d >= 0 ? '+' : ''}{assetValuation.change30d.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#171717]/50">YTD</div>
                      <div className="font-bold text-emerald-600">+24.8%</div>
                    </div>
                  </div>

                  {/* Physical Asset Badge */}
                  <div className="mt-4">
                    <PhysicalAssetBadge />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sovereign Infrastructure Share - Investment Widget */}
            <div className="mb-8">
              <SovereignInfrastructureShare />
            </div>

            {/* Top Performing Nodes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-[#171717]/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#171717]">Top Performing Nodes</h3>
                  <p className="text-xs text-[#171717]/50">Highest APY & Efficiency</p>
                </div>
                <a href="#" className="text-sm text-emerald-600 font-medium hover:underline">
                  View All →
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Node 1 */}
                <div className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl p-4 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <div className="font-bold">Dubai Solar</div>
                      <div className="text-xs text-white/50">UAE</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white/50">APY</div>
                      <div className="text-2xl font-black text-amber-400">15.2%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">Efficiency</div>
                      <div className="text-lg font-bold text-emerald-400">92%</div>
                    </div>
                  </div>
                </div>

                {/* Node 2 */}
                <div className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl p-4 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🥈</span>
                    </div>
                    <div>
                      <div className="font-bold">Tokyo Exchange</div>
                      <div className="text-xs text-white/50">Japan</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white/50">APY</div>
                      <div className="text-2xl font-black text-cyan-400">14.8%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">Efficiency</div>
                      <div className="text-lg font-bold text-emerald-400">97%</div>
                    </div>
                  </div>
                </div>

                {/* Node 3 */}
                <div className="bg-gradient-to-br from-[#171717] to-[#2a2a2a] rounded-xl p-4 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🥉</span>
                    </div>
                    <div>
                      <div className="font-bold">NY Exchange</div>
                      <div className="text-xs text-white/50">USA</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white/50">APY</div>
                      <div className="text-2xl font-black text-purple-400">14.5%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">Efficiency</div>
                      <div className="text-lg font-bold text-emerald-400">95%</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[#171717]/40">
                All investments are backed by verified physical assets. APY rates are variable based on network performance.
              </p>
              <p className="text-xs text-[#171717]/40 mt-1">
                KAUS tokens are required for investment. Connect your wallet to participate.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
