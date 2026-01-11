'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, TrendingUp, Cpu, ShoppingBag, ArrowRight } from 'lucide-react';

// Tesla Style Color Palette
const colors = {
  bg: 'bg-[#F2F0EB]', // Warm Ivory
  card: 'bg-white',
  text: 'text-[#1A1A1A]',
  subText: 'text-gray-500',
  accent: 'text-[#B8860B]', // Muted Gold for Luxury
  border: 'border-gray-100',
};

// Mock Data Structure (Simulating AI Backend)
interface SourcingMission {
  id: number;
  target: string;
  status: 'Hunting' | 'Negotiating' | 'Ready';
  progress: number;
  foundPrice: number;
  marketPrice: number;
  margin: number;
}

export default function NexusDashboard() {
  const [missions, setMissions] = useState<SourcingMission[]>([
    { id: 1, target: 'Rolex Submariner Date', status: 'Negotiating', progress: 75, foundPrice: 13500, marketPrice: 16000, margin: 18 },
    { id: 2, target: 'Chanel Classic Flap (Black)', status: 'Hunting', progress: 30, foundPrice: 0, marketPrice: 10200, margin: 0 },
  ]);

  // Simulation of AI Working (2026 Trend: Real-time Feedback)
  useEffect(() => {
    const interval = setInterval(() => {
      setMissions((prev) =>
        prev.map((m) => {
          if (m.status === 'Negotiating' && m.progress < 95) {
            return { ...m, progress: m.progress + 1 };
          }
          return m;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen ${colors.bg} p-8 font-sans`}>
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className={`text-3xl font-bold ${colors.text} tracking-tight`}>NEXUS AGENT</h1>
          <p className={`${colors.subText} text-sm mt-1`}>AI Operations Center • Seoul</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            System Operational
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: AI Status (The Brain) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 space-y-6"
        >
          <h2 className={`text-xl font-semibold ${colors.text} mb-4`}>Active Missions</h2>
          
          {missions.map((mission) => (
            <div key={mission.id} className={`${colors.card} p-6 rounded-3xl shadow-sm border ${colors.border} relative overflow-hidden group hover:shadow-md transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${mission.status === 'Hunting' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {mission.status === 'Hunting' ? <Cpu size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{mission.target}</h3>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{mission.status} Phase</span>
                  </div>
                </div>
                {mission.status === 'Negotiating' && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Target Margin</p>
                    <p className="text-xl font-bold text-green-600">{mission.margin}%</p>
                  </div>
                )}
              </div>

              {/* Progress Bar with Tesla Vibe */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-[#1A1A1A]"
                  initial={{ width: 0 }}
                  animate={{ width: `${mission.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-500">AI is analyzing 42 global boutiques...</p>
                <button className="flex items-center gap-2 font-medium hover:underline">
                  View Details <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right Col: Market Intelligence (The Opportunity) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`${colors.card} p-8 rounded-3xl shadow-sm border ${colors.border} h-fit`}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className={colors.accent} />
            <h2 className="text-xl font-semibold">Market Arbitrage</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-[#F9F9F9] rounded-2xl">
              <p className="text-xs text-gray-400 mb-1">RECOMMENDATION</p>
              <h4 className="font-medium text-lg mb-2">Hermès Mini Kelly II</h4>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Sourcing Price</span>
                <span className="font-bold">$28,500</span>
              </div>
              <div className="flex justify-between text-sm border-b pb-2 mb-2">
                <span className="text-gray-500">Resale Estimate</span>
                <span className="font-bold">$34,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs">+19.2% Margin</span>
                <button className="bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors">
                  START HUNT
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400">Powered by Nexus Agent Engine v2.4</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}