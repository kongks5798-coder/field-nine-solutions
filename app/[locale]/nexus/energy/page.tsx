/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 66: ENERGY SOVEREIGNTY DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tesla Powerwall + Global Energy Nodes
 * Neural Flow Animation + Cyan Accent (#00E5FF)
 *
 * @route /nexus/energy
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MobileBottomNav, MobileHeader } from '@/components/nexus/mobile-nav';

// Neural Flow Background Component
function NeuralFlowBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-20"
          style={{ top: `${20 + i * 15}%`, left: '-100%', width: '200%' }}
          animate={{ x: ['0%', '50%'] }}
          transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

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

interface EnergyNode {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'battery' | 'grid';
  capacity: number;
  currentOutput: number;
  status: 'online' | 'offline' | 'maintenance';
  location: string;
}

export default function EnergyDashboardPage() {
  const [teslaData, setTeslaData] = useState<TeslaLiveData | null>(null);
  const [yeongdongData, setYeongdongData] = useState<YeongdongLiveData | null>(null);
  const [loading, setLoading] = useState(true);

  // Energy Nodes Network
  const energyNodes: EnergyNode[] = [
    { id: 'yd-solar', name: 'Yeongdong Solar', type: 'solar', capacity: 50, currentOutput: yeongdongData?.currentOutput || 0, status: 'online', location: 'Gangwon-do' },
    { id: 'tesla-v2g', name: 'Tesla Powerwall', type: 'battery', capacity: 75.6, currentOutput: teslaData?.v2gAvailable || 0, status: 'online', location: 'Seoul HQ' },
    { id: 'jeju-wind', name: 'Jeju Wind Farm', type: 'wind', capacity: 30, currentOutput: 18.5, status: 'online', location: 'Jeju Island' },
    { id: 'busan-grid', name: 'Busan Grid Link', type: 'grid', capacity: 100, currentOutput: 67.2, status: 'online', location: 'Busan' },
  ];

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [teslaRes, yeongdongRes] = await Promise.all([
          fetch('/api/live/tesla').catch(() => null),
          fetch('/api/live/yeongdong').catch(() => null),
        ]);

        if (teslaRes?.ok) {
          setTeslaData(await teslaRes.json());
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
          setYeongdongData(await yeongdongRes.json());
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
        console.log('[Energy] Using fallback data');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalCapacity = energyNodes.reduce((sum, node) => sum + node.capacity, 0);
  const totalOutput = energyNodes.reduce((sum, node) => sum + node.currentOutput, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <NeuralFlowBg />
      {/* Mobile Header */}
      <MobileHeader title="Energy Node" />

      <main className="relative z-10 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Network Status */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-black text-white">Energy Network</h1>
              <p className="text-sm text-white/50">Real-time node monitoring</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              teslaData?.isLive ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/30' : 'bg-amber-500/20 border border-amber-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                teslaData?.isLive ? 'bg-[#00E5FF]' : 'bg-amber-500'
              }`} />
              <span className={`text-xs font-bold ${
                teslaData?.isLive ? 'text-[#00E5FF]' : 'text-amber-400'
              }`}>
                {teslaData?.isLive ? 'LIVE' : 'SIMULATED'}
              </span>
            </div>
          </motion.div>

          {/* Total Network Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#171717] rounded-3xl p-6 text-white border border-[#00E5FF]/20"
          >
            <div className="text-sm text-[#00E5FF] mb-2">Total Network Output</div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black">{loading ? '—' : totalOutput.toFixed(1)}</span>
              <span className="text-xl text-white/50 mb-2">MW</span>
            </div>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalOutput / totalCapacity) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00E5FF]/50"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span>0 MW</span>
              <span>{totalCapacity} MW capacity</span>
            </div>
          </motion.div>

          {/* Tesla Powerwall */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-[#00E5FF]/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#00E5FF]/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tesla Powerwall</h3>
                  <p className="text-sm text-white/50">V2G Energy Storage</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                teslaData?.v2gStatus === 'ACTIVE' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' :
                teslaData?.v2gStatus === 'CHARGING' ? 'bg-cyan-500/20 text-cyan-400' :
                teslaData?.v2gStatus === 'DISCHARGING' ? 'bg-amber-500/20 text-amber-400' :
                'bg-white/10 text-white/50'
              }`}>
                {teslaData?.v2gStatus || 'LOADING'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-white/50 mb-1">Battery Level</div>
                <div className="text-4xl font-black text-white">
                  {loading ? '—' : `${teslaData?.batteryLevel}%`}
                </div>
                <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${teslaData?.batteryLevel || 0}%` }}
                    className="h-full bg-[#00E5FF]"
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-white/50 mb-1">V2G Available</div>
                <div className="text-4xl font-black text-white">
                  {loading ? '—' : (teslaData?.v2gAvailable ?? 0).toFixed(1)}
                  <span className="text-lg font-medium text-white/50 ml-1">kWh</span>
                </div>
                <div className="text-sm text-white/40 mt-2">
                  of {(teslaData?.energyStored ?? 0).toFixed(1)} kWh stored
                </div>
              </div>
            </div>
          </motion.div>

          {/* Yeongdong Solar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-[#00E5FF]/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">☀️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Yeongdong Solar</h3>
                  <p className="text-sm text-white/50">100,000평 태양광 발전소</p>
                </div>
              </div>
              <div className="text-2xl">
                {yeongdongData?.weatherCondition === 'sunny' ? '☀️' :
                 yeongdongData?.weatherCondition === 'cloudy' ? '☁️' :
                 yeongdongData?.weatherCondition === 'partly_cloudy' ? '⛅' : '🌧️'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-white/50 mb-1">Current Output</div>
                <div className="text-4xl font-black text-white">
                  {loading ? '—' : yeongdongData?.currentOutput}
                  <span className="text-lg font-medium text-white/50 ml-1">MW</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse" />
                  <span className="text-xs text-[#00E5FF] font-medium">GENERATING</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-white/50 mb-1">Today's Revenue</div>
                <div className="text-3xl font-black text-[#00E5FF]">
                  {loading ? '—' : `₩${((yeongdongData?.todayEarningsKRW ?? 0) / 10000).toFixed(0)}만`}
                </div>
                <div className="text-sm text-white/40 mt-2">
                  ${(yeongdongData?.todayEarningsUSD ?? 0).toLocaleString()} USD
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-sm">
              <div>
                <span className="text-white/50">Daily:</span>
                <span className="font-bold text-white ml-2">{yeongdongData?.dailyGeneration ?? 0} MWh</span>
              </div>
              <div>
                <span className="text-white/50">SMP:</span>
                <span className="font-bold text-white ml-2">₩{yeongdongData?.smpPrice ?? 0}/kWh</span>
              </div>
            </div>
          </motion.div>

          {/* Energy Nodes Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-white mb-4">All Nodes</h2>
            <div className="space-y-3">
              {energyNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-[#00E5FF]/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      node.type === 'solar' ? 'bg-amber-500/20' :
                      node.type === 'wind' ? 'bg-cyan-500/20' :
                      node.type === 'battery' ? 'bg-[#00E5FF]/20' :
                      'bg-white/10'
                    }`}>
                      <span className="text-lg">
                        {node.type === 'solar' ? '☀️' :
                         node.type === 'wind' ? '💨' :
                         node.type === 'battery' ? '🔋' : '⚡'}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white">{node.name}</div>
                      <div className="text-xs text-white/50">{node.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white">
                      {node.currentOutput.toFixed(1)}
                      <span className="text-sm font-medium text-white/50 ml-1">
                        {node.type === 'battery' ? 'kWh' : 'MW'}
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${
                      node.status === 'online' ? 'text-[#00E5FF]' :
                      node.status === 'maintenance' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {node.status.toUpperCase()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
