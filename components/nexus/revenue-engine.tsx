'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 39: REVENUE & GROWTH ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Target: $10M Revenue
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// FOMO MARKETING WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function ProfitOpportunityWidget() {
  const [smpPrice, setSmpPrice] = useState(128);
  const [lowestChargePrice] = useState(85);
  const [spotsLeft, setSpotsLeft] = useState(800);

  useEffect(() => {
    // Simulate SMP price fluctuation
    const interval = setInterval(() => {
      setSmpPrice(prev => {
        const change = (Math.random() - 0.4) * 5;
        return Math.max(90, Math.min(180, prev + change));
      });
    }, 3000);

    // Decrease spots slowly
    const spotsInterval = setInterval(() => {
      setSpotsLeft(prev => Math.max(0, prev - Math.floor(Math.random() * 2)));
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(spotsInterval);
    };
  }, []);

  const profitMargin = ((smpPrice - lowestChargePrice) / lowestChargePrice * 100).toFixed(1);
  const isHighProfit = parseFloat(profitMargin) > 40;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 border-2 ${
        isHighProfit
          ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30'
          : 'bg-[#171717] border-[#171717]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isHighProfit ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={`text-xs tracking-widest ${isHighProfit ? 'text-emerald-600' : 'text-amber-400'}`}>
            PROFIT OPPORTUNITY
          </span>
        </div>
        {isHighProfit && (
          <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
            HOT
          </span>
        )}
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className={`text-[10px] uppercase tracking-wider mb-1 ${isHighProfit ? 'text-[#171717]/60' : 'text-white/40'}`}>
            Current SMP
          </div>
          <div className={`text-2xl font-bold ${isHighProfit ? 'text-[#171717]' : 'text-white'}`}>
            ₩{Math.round(smpPrice)}
          </div>
          <div className={`text-xs ${isHighProfit ? 'text-[#171717]/40' : 'text-white/40'}`}>/kWh</div>
        </div>

        <div>
          <div className={`text-[10px] uppercase tracking-wider mb-1 ${isHighProfit ? 'text-[#171717]/60' : 'text-white/40'}`}>
            Charge Cost
          </div>
          <div className={`text-2xl font-bold ${isHighProfit ? 'text-[#171717]' : 'text-white'}`}>
            ₩{lowestChargePrice}
          </div>
          <div className={`text-xs ${isHighProfit ? 'text-emerald-600' : 'text-emerald-400'}`}>Overnight Low</div>
        </div>

        <div>
          <div className={`text-[10px] uppercase tracking-wider mb-1 ${isHighProfit ? 'text-[#171717]/60' : 'text-white/40'}`}>
            Profit Margin
          </div>
          <div className={`text-3xl font-black ${isHighProfit ? 'text-emerald-600' : 'text-emerald-400'}`}>
            +{profitMargin}%
          </div>
          <div className={`text-xs ${isHighProfit ? 'text-emerald-600' : 'text-emerald-400'}`}>per kWh</div>
        </div>
      </div>

      {/* Early Bird Banner */}
      <div className={`rounded-xl p-4 ${isHighProfit ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500 text-lg">🔥</span>
              <span className={`font-bold ${isHighProfit ? 'text-[#171717]' : 'text-white'}`}>Early Bird Special</span>
            </div>
            <div className={`text-sm ${isHighProfit ? 'text-[#171717]/70' : 'text-white/70'}`}>
              0% trading fee for first adopters
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-amber-500">{spotsLeft}</div>
            <div className={`text-xs ${isHighProfit ? 'text-[#171717]/60' : 'text-white/60'}`}>spots left</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-colors ${
          isHighProfit
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'bg-white text-[#171717] hover:bg-white/90'
        }`}
      >
        Start Trading Now
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS COIN BONUS WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export function KausBonusWidget() {
  const [inputKwh, setInputKwh] = useState(100);
  const baseKausRate = 10; // 10 KAUS per kWh
  const bonusRate = 0.10; // 10% bonus

  const baseKaus = inputKwh * baseKausRate;
  const bonusKaus = baseKaus * bonusRate;
  const totalKaus = baseKaus + bonusKaus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">K</span>
        </div>
        <div>
          <div className="font-bold text-[#171717]">Kaus Coin Bonus</div>
          <div className="text-xs text-[#171717]/60">+10% Extra on Energy Purchase</div>
        </div>
        <div className="ml-auto px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
          LIMITED
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white/50 rounded-xl p-4 mb-4">
        <div className="text-xs text-[#171717]/60 mb-2">Energy Amount (kWh)</div>
        <input
          type="range"
          min="10"
          max="500"
          value={inputKwh}
          onChange={(e) => setInputKwh(Number(e.target.value))}
          className="w-full h-2 bg-[#171717]/10 rounded-lg appearance-none cursor-pointer"
        />
        <div className="text-2xl font-bold text-[#171717] mt-2">{inputKwh} kWh</div>
      </div>

      {/* Result */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/50 rounded-xl p-3 text-center">
          <div className="text-xs text-[#171717]/60">Base</div>
          <div className="text-lg font-bold text-[#171717]">{baseKaus.toLocaleString()}</div>
          <div className="text-xs text-[#171717]/40">KAUS</div>
        </div>
        <div className="bg-emerald-500/20 rounded-xl p-3 text-center border border-emerald-500/30">
          <div className="text-xs text-emerald-600">Bonus +10%</div>
          <div className="text-lg font-bold text-emerald-600">+{bonusKaus.toLocaleString()}</div>
          <div className="text-xs text-emerald-600/60">KAUS</div>
        </div>
        <div className="bg-amber-500/20 rounded-xl p-3 text-center border border-amber-500/30">
          <div className="text-xs text-amber-600">Total</div>
          <div className="text-lg font-bold text-amber-600">{totalKaus.toLocaleString()}</div>
          <div className="text-xs text-amber-600/60">KAUS</div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export function SocialProofWidget() {
  const [visitors, setVisitors] = useState(247);
  const [nodes, setNodes] = useState([12, 15, 18, 22, 19, 25, 28, 31, 27, 33, 38, 42]);
  const [realtimeUsers, setRealtimeUsers] = useState(18);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors(prev => prev + Math.floor(Math.random() * 3));
      setRealtimeUsers(Math.floor(Math.random() * 20) + 10);
      setNodes(prev => {
        const newNodes = [...prev.slice(1), prev[prev.length - 1] + Math.floor(Math.random() * 5) - 1];
        return newNodes;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const maxNode = Math.max(...nodes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#171717] rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-xs tracking-widest text-cyan-400">NETWORK GROWTH</span>
        </div>
        <span className="text-[10px] text-white/40">LIVE METRICS</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Visitors</div>
          <div className="text-2xl font-bold text-white">{visitors.toLocaleString()}</div>
          <div className="text-xs text-emerald-400">+{Math.floor(visitors * 0.12)}% this week</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Online Now</div>
          <div className="text-2xl font-bold text-cyan-400">{realtimeUsers}</div>
          <div className="text-xs text-white/40">active users</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Active Nodes</div>
          <div className="text-2xl font-bold text-white">{nodes[nodes.length - 1]}</div>
          <div className="text-xs text-emerald-400">+{Math.floor((nodes[nodes.length - 1] / nodes[0] - 1) * 100)}% growth</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-16 flex items-end gap-1">
        {nodes.map((value, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t"
            initial={{ height: 0 }}
            animate={{ height: `${(value / maxNode) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-white/30 mt-2">
        <span>12h ago</span>
        <span>Now</span>
      </div>

      {/* Investor Badge */}
      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <span className="text-sm text-white/80">
            <span className="text-emerald-400 font-bold">{Math.floor(visitors * 0.08)}</span> investors watching this week
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KAUS BONUS API ENDPOINT LOGIC (for reference)
// ═══════════════════════════════════════════════════════════════════════════════

export const KAUS_BONUS_CONFIG = {
  baseRate: 10, // 10 KAUS per kWh
  bonusRate: 0.10, // 10% bonus
  minPurchase: 10, // minimum 10 kWh
  maxPurchase: 10000, // maximum 10,000 kWh
};

export function calculateKausBonus(kwhAmount: number): {
  base: number;
  bonus: number;
  total: number;
  bonusPercent: number;
} {
  const base = kwhAmount * KAUS_BONUS_CONFIG.baseRate;
  const bonus = base * KAUS_BONUS_CONFIG.bonusRate;
  return {
    base,
    bonus,
    total: base + bonus,
    bonusPercent: KAUS_BONUS_CONFIG.bonusRate * 100,
  };
}
