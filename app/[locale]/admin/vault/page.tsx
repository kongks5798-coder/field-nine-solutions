/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 85: SOVEREIGN VAULT - ONE-TAP QR ACCESS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * MINIMALIST SECURITY:
 * - kongks5798@gmail.com = Auto-unlock (no keypad)
 * - QR Code for mobile access
 * - One-tap entry for Emperor
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CentralBank } from '@/components/admin/CentralBank';
import { isEmperor } from '@/lib/auth/emperor-whitelist';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type VaultState = 'checking' | 'unauthorized' | 'require-login' | 'unlocked';

interface AuthData {
  email: string;
  role: string;
}

interface EmperorStats {
  users: { total: number; active: number };
  balances: { totalKaus: number; totalKwh: number; totalUsd: number; totalKrw: number };
  reserve: { totalSupply: number; circulating: number; systemReserve: number };
  server: { cpu: number; memory: number; uptime: number; activeConnections: number; requestsPerSecond: number };
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE COMPONENT (Simple SVG-based)
// ═══════════════════════════════════════════════════════════════════════════════

function SovereignQRCode({ token }: { token: string }) {
  // Simple QR-like pattern (visual representation)
  const size = 180;
  const modules = 21;
  const moduleSize = size / modules;

  // Generate pseudo-random pattern based on token
  const pattern = Array.from({ length: modules * modules }, (_, i) => {
    const hash = (token.charCodeAt(i % token.length) * (i + 1)) % 100;
    return hash > 40;
  });

  return (
    <div className="relative">
      <svg width={size} height={size} className="rounded-xl">
        <rect width={size} height={size} fill="white" />
        {pattern.map((filled, i) => {
          if (!filled) return null;
          const x = (i % modules) * moduleSize;
          const y = Math.floor(i / modules) * moduleSize;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={moduleSize}
              height={moduleSize}
              fill="#171717"
            />
          );
        })}
        {/* Positioning squares */}
        <rect x={0} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="none" stroke="#171717" strokeWidth={2} />
        <rect x={size - moduleSize * 7} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="none" stroke="#171717" strokeWidth={2} />
        <rect x={0} y={size - moduleSize * 7} width={moduleSize * 7} height={moduleSize * 7} fill="none" stroke="#171717" strokeWidth={2} />
        {/* Inner squares */}
        <rect x={moduleSize * 2} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#171717" />
        <rect x={size - moduleSize * 5} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#171717" />
        <rect x={moduleSize * 2} y={size - moduleSize * 5} width={moduleSize * 3} height={moduleSize * 3} fill="#171717" />
      </svg>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-[#00E5FF]/10 blur-xl rounded-full -z-10" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VAULT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VaultPage() {
  const [vaultState, setVaultState] = useState<VaultState>('checking');
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [emperorStats, setEmperorStats] = useState<EmperorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch Emperor stats
  const fetchEmperorStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/admin/vault/stats');
      const data = await res.json();
      if (data.success) {
        setEmperorStats(data.data);
      }
    } catch (err) {
      console.error('[Vault] Stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Check authorization
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setVaultState('checking');
      const res = await fetch('/api/admin/vault/auth');
      const data = await res.json();

      if (!data.authorized) {
        if (data.requiresLogin) {
          setVaultState('require-login');
        } else {
          setVaultState('unauthorized');
        }
        return;
      }

      setAuthData(data.user);

      // Emperor auto-unlock
      if (isEmperor(data.user?.email)) {
        console.log('[Vault] 👑 Emperor detected - auto-unlocking');
        setQrToken(`SOVEREIGN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        setVaultState('unlocked');
        // Fetch Emperor stats
        fetchEmperorStats();
        // Auto-refresh stats every 30s
        const statsInterval = setInterval(fetchEmperorStats, 30000);
        return () => clearInterval(statsInterval);
      }

      // Non-emperor - check session
      const sessionRes = await fetch('/api/admin/vault/session');
      const sessionData = await sessionRes.json();

      if (sessionData.valid) {
        setVaultState('unlocked');
      } else {
        setVaultState('unauthorized');
      }
    } catch (err) {
      console.error('[Vault] Auth error:', err);
      setVaultState('unauthorized');
    }
  };

  const handleLogin = () => {
    const locale = window.location.pathname.split('/')[1] || 'ko';
    window.location.href = `/${locale}/auth/login?redirect=/admin/vault`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AnimatePresence mode="wait">
        {/* CHECKING */}
        {vaultState === 'checking' && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 border-4 border-[#00E5FF] border-t-transparent rounded-full mb-6"
            />
            <div className="text-xl font-black text-white">SOVEREIGN VAULT</div>
            <div className="text-white/50 text-sm mt-2">Verifying clearance...</div>
          </motion.div>
        )}

        {/* REQUIRE LOGIN */}
        {vaultState === 'require-login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <div className="text-6xl mb-6">🔐</div>
            <h1 className="text-3xl font-black text-white mb-2">SOVEREIGN VAULT</h1>
            <p className="text-white/50 mb-8">Emperor authentication required</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="px-8 py-4 bg-[#00E5FF] text-[#171717] font-black text-lg rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.3)]"
            >
              AUTHENTICATE
            </motion.button>
          </motion.div>
        )}

        {/* UNAUTHORIZED */}
        {vaultState === 'unauthorized' && (
          <motion.div
            key="unauthorized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-950/20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl mb-8"
            >
              🛡️
            </motion.div>
            <h1 className="text-3xl font-black text-red-500 mb-4">ACCESS DENIED</h1>
            <p className="text-white/50 text-center max-w-md mb-8">
              This area requires Emperor-level clearance.
              <br />
              Your access attempt has been logged.
            </p>

            <Link href="/ko/nexus/energy">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                ← Return to Nexus
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* UNLOCKED */}
        {vaultState === 'unlocked' && (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#00E5FF]/10 to-transparent border-b border-[#00E5FF]/20">
              <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🔓</span>
                    <div>
                      <h1 className="text-xl font-black text-white flex items-center gap-2">
                        SOVEREIGN VAULT
                        <span className="text-xs px-2 py-0.5 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full">
                          UNLOCKED
                        </span>
                      </h1>
                      <p className="text-white/50 text-sm">{authData?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* QR Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowQR(!showQR)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-colors"
                    >
                      {showQR ? '✕ Close' : '📱 QR Access'}
                    </motion.button>

                    {/* Lock Button */}
                    <Link href="/ko/nexus/energy">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors"
                      >
                        🔒 Exit
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Modal */}
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowQR(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#171717] rounded-3xl p-8 border border-[#00E5FF]/30 max-w-sm mx-4"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-black text-white mb-2">Mobile Access</h2>
                      <p className="text-white/50 text-sm">Scan with your phone to access vault</p>
                    </div>

                    <div className="flex justify-center mb-6">
                      <SovereignQRCode token={qrToken} />
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <div className="text-xs text-white/40 mb-1">Session Token</div>
                      <code className="text-xs text-[#00E5FF] font-mono break-all">{qrToken}</code>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowQR(false)}
                      className="w-full py-3 bg-[#00E5FF] text-[#171717] font-bold rounded-xl"
                    >
                      Done
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              {/* Quick Stats */}
              <div className="mb-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👑</span>
                      <div>
                        <div className="text-xs text-white/50">Emperor</div>
                        <div className="text-white font-bold">{authData?.email?.split('@')[0]}</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <div className="text-xs text-white/50">Security</div>
                        <div className="text-[#00E5FF] font-bold">MAXIMUM</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/30 font-mono">
                    v89.0 • Emperor View
                  </div>
                </div>
              </div>

              {/* PHASE 89: EMPEROR VIEW - Real-time Stats */}
              <div className="mb-8">
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="text-amber-400">👁️</span> Emperor View
                  {statsLoading && (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-4 h-4 border-2 border-[#00E5FF] border-t-transparent rounded-full"
                    />
                  )}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Users */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-900/10 rounded-2xl border border-purple-500/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">👥</span>
                      <span className="text-white/50 text-sm">Total Users</span>
                    </div>
                    <motion.div
                      key={emperorStats?.users?.total}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-black text-white"
                    >
                      {emperorStats?.users?.total?.toLocaleString() || '—'}
                    </motion.div>
                    <div className="text-xs text-purple-400 mt-1">
                      {emperorStats?.users?.active?.toLocaleString() || 0} active
                    </div>
                  </motion.div>

                  {/* Total KAUS Balance */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-gradient-to-br from-[#00E5FF]/10 to-cyan-900/10 rounded-2xl border border-[#00E5FF]/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">💰</span>
                      <span className="text-white/50 text-sm">Total KAUS</span>
                    </div>
                    <motion.div
                      key={emperorStats?.balances?.totalKaus}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-black text-[#00E5FF]"
                    >
                      {emperorStats?.balances?.totalKaus?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}
                    </motion.div>
                    <div className="text-xs text-cyan-400 mt-1">
                      ≈ ${emperorStats?.balances?.totalUsd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
                    </div>
                  </motion.div>

                  {/* Total Energy */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 rounded-2xl border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">⚡</span>
                      <span className="text-white/50 text-sm">Total Energy</span>
                    </div>
                    <motion.div
                      key={emperorStats?.balances?.totalKwh}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-black text-emerald-400"
                    >
                      {emperorStats?.balances?.totalKwh?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}
                    </motion.div>
                    <div className="text-xs text-emerald-400/70 mt-1">kWh in network</div>
                  </motion.div>

                  {/* Server Status */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-900/10 rounded-2xl border border-amber-500/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🖥️</span>
                      <span className="text-white/50 text-sm">Server Status</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/50">CPU</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${emperorStats?.server?.cpu || 0}%` }}
                              className="h-full bg-amber-400 rounded-full"
                            />
                          </div>
                          <span className="text-xs text-amber-400 font-mono">{emperorStats?.server?.cpu || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/50">Memory</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${emperorStats?.server?.memory || 0}%` }}
                              className="h-full bg-[#00E5FF] rounded-full"
                            />
                          </div>
                          <span className="text-xs text-cyan-400 font-mono">{emperorStats?.server?.memory || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/50">Uptime</span>
                        <span className="text-xs text-emerald-400 font-mono">{emperorStats?.server?.uptime || 99.99}%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Central Bank */}
              <CentralBank />

              {/* Quick Links */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/ko/admin/emperor">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-[#00E5FF]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⚡</span>
                      <div>
                        <h3 className="font-bold text-white">System Control</h3>
                        <p className="text-white/50 text-sm">Rates & Users</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                <Link href="/ko/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📊</span>
                      <div>
                        <h3 className="font-bold text-white">Dashboard</h3>
                        <p className="text-white/50 text-sm">Zen View</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>

                <Link href="/ko/nexus/exchange">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💱</span>
                      <div>
                        <h3 className="font-bold text-white">Exchange</h3>
                        <p className="text-white/50 text-sm">Trade KAUS</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-white/30 text-xs">
                <p>Sovereign Vault v85.0 • One-Tap QR Access</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
