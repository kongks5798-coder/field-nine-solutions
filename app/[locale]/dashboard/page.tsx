/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 85: ZEN DASHBOARD - MINIMALIST SOVEREIGNTY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 테슬라형 심플 대시보드
 * - 현재 자산
 * - 수익률
 * - 매수/매도 버튼
 *
 * 색상: 웜 아이보리(#F9F9F7) + 딥 블랙(#171717)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { isEmperor } from '@/lib/auth/emperor-whitelist';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface WalletData {
  kausBalance: number;
  kwhBalance: number;
  krwValue: number;
  usdValue: number;
  isLive: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  email?: string;
  isLoading: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZEN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ZenDashboardPage() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, isLoading: true });
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profitPercent, setProfitPercent] = useState(0);

  // Fetch wallet balance
  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/kaus/user-balance');
      if (res.status === 401) {
        setAuth({ isAuthenticated: false, isLoading: false });
        setWallet(null);
        return;
      }
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setAuth({ isAuthenticated: true, email: data.email, isLoading: false });
        setWallet({
          kausBalance: data.kausBalance || 0,
          kwhBalance: data.kwhBalance || 0,
          krwValue: data.krwValue || 0,
          usdValue: data.usdValue || 0,
          isLive: data.isLive || false,
        });
        // Calculate simulated profit (based on base value of 100 KAUS = $10)
        const baseValue = 10;
        const currentValue = data.usdValue || 0;
        if (currentValue > 0) {
          setProfitPercent(((currentValue - baseValue) / baseValue) * 100);
        }
      } else {
        setAuth({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      setAuth({ isAuthenticated: false, isLoading: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    const interval = setInterval(fetchWallet, 30000);
    return () => clearInterval(interval);
  }, [fetchWallet]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] relative">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-[#F9F9F7]/95 backdrop-blur-sm border-b border-[#171717]/10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-[#171717] tracking-tight">FIELD NINE</h1>
          <div className="flex items-center gap-3">
            {/* PHASE 88: Emperor Control Panel Button */}
            {auth.email && isEmperor(auth.email) && (
              <Link href="/ko/admin/vault">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/50"
                  style={{ boxShadow: '0 0 15px rgba(245,158,11,0.3)' }}
                >
                  <motion.span
                    animate={{
                      textShadow: ['0 0 5px rgba(245,158,11,0.5)', '0 0 15px rgba(245,158,11,0.8)', '0 0 5px rgba(245,158,11,0.5)'],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-base"
                  >
                    👑
                  </motion.span>
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400"
                  />
                </motion.div>
              </Link>
            )}
            {wallet?.isLive ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#171717] rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#171717]/10 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-bold text-[#171717]/60">OFFLINE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        {/* Auth Check */}
        {!auth.isLoading && !auth.isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-black text-[#171717] mb-2">Login Required</h2>
            <p className="text-[#171717]/50 mb-8">Sign in to view your portfolio</p>
            <Link
              href="/ko/auth/login"
              className="inline-block px-8 py-4 bg-[#171717] text-white font-bold rounded-2xl hover:bg-[#2d2d2d] transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* MAIN CARD: Total Asset */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#171717] rounded-3xl p-8 text-center"
            >
              <p className="text-white/50 text-sm mb-2">Total Assets</p>
              {loading ? (
                <div className="h-16 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-5xl font-black text-white mb-1"
                  >
                    {(wallet?.kausBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    <span className="text-2xl font-medium text-white/60 ml-2">KAUS</span>
                  </motion.div>
                  <p className="text-white/40 text-lg">
                    ≈ ${(wallet?.usdValue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </>
              )}
            </motion.div>

            {/* Profit Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-[#171717]/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#171717]/50 text-sm mb-1">Today's Return</p>
                  <div className={`text-3xl font-black ${profitPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  profitPercent >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  <span className="text-3xl">{profitPercent >= 0 ? '📈' : '📉'}</span>
                </div>
              </div>
            </motion.div>

            {/* Energy Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 border border-[#171717]/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#171717]/50 text-sm mb-1">Energy Balance</p>
                  <div className="text-2xl font-black text-[#171717]">
                    {(wallet?.kwhBalance || 0).toFixed(2)}
                    <span className="text-lg font-medium text-[#171717]/50 ml-1">kWh</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <span className="text-3xl">⚡</span>
                </div>
              </div>
            </motion.div>

            {/* ACTION BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Buy Button */}
              <Link href="/ko/nexus/exchange">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 bg-[#171717] text-white font-black text-lg rounded-2xl hover:bg-[#2d2d2d] transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">⬆️</span>
                  Buy
                </motion.button>
              </Link>

              {/* Sell Button */}
              <Link href="/ko/nexus/exchange">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 bg-white text-[#171717] font-black text-lg rounded-2xl border-2 border-[#171717] hover:bg-[#171717] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">⬇️</span>
                  Sell
                </motion.button>
              </Link>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3"
            >
              <Link href="/ko/nexus/energy">
                <div className="bg-white rounded-xl p-4 border border-[#171717]/10 flex items-center justify-between hover:border-[#171717]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <span className="text-lg">🔋</span>
                    </div>
                    <span className="font-bold text-[#171717]">Energy Network</span>
                  </div>
                  <span className="text-[#171717]/30">→</span>
                </div>
              </Link>

              <Link href="/ko/nexus/exchange">
                <div className="bg-white rounded-xl p-4 border border-[#171717]/10 flex items-center justify-between hover:border-[#171717]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-lg">💱</span>
                    </div>
                    <span className="font-bold text-[#171717]">Exchange</span>
                  </div>
                  <span className="text-[#171717]/30">→</span>
                </div>
              </Link>

              <Link href="/ko/nexus/api-docs">
                <div className="bg-white rounded-xl p-4 border border-[#171717]/10 flex items-center justify-between hover:border-[#171717]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <span className="text-lg">🔌</span>
                    </div>
                    <span className="font-bold text-[#171717]">API Portal</span>
                  </div>
                  <span className="text-[#171717]/30">→</span>
                </div>
              </Link>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-8 pb-4"
            >
              <p className="text-[#171717]/30 text-xs">
                Field Nine Sovereignty • v85.0
              </p>
            </motion.div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#171717]/10 px-6 py-3 pb-safe">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          <Link href="/ko/dashboard" className="flex flex-col items-center gap-1 text-[#171717]">
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link href="/ko/nexus/exchange" className="flex flex-col items-center gap-1 text-[#171717]/50 hover:text-[#171717]">
            <span className="text-xl">💱</span>
            <span className="text-[10px] font-bold">Trade</span>
          </Link>
          <Link href="/ko/nexus/energy" className="flex flex-col items-center gap-1 text-[#171717]/50 hover:text-[#171717]">
            <span className="text-xl">⚡</span>
            <span className="text-[10px] font-bold">Energy</span>
          </Link>
          <Link href="/ko/nexus/profile" className="flex flex-col items-center gap-1 text-[#171717]/50 hover:text-[#171717]">
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
