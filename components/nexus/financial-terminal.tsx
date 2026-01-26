'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 44: FINANCIAL TERMINAL UI
 * ═══════════════════════════════════════════════════════════════════════════════
 * Sidebar Navigation + Real-time Price Ticker
 */

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentKausPrice, getTradingSignal } from '@/lib/fin/price-feed';

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: 'energy', icon: '⚡', label: 'Dashboard', path: '/ko/nexus/energy' },
  { id: 'trading', icon: '🔮', label: 'Prophet AI', path: '/ko/nexus/trading' },
  { id: 'assets', icon: '🏛️', label: 'Assets', path: '/ko/nexus/assets' },
  { id: 'exchange', icon: '📈', label: 'Exchange', path: '/ko/nexus/exchange' },
  { id: 'market', icon: '🛒', label: 'Market', path: '/ko/nexus/market' },
  { id: 'profile', icon: '👤', label: 'Profile', path: '/ko/nexus/profile' },
];

export function FinancialSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentPath = pathname || '/ko/nexus/energy';

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed left-0 top-0 h-full bg-[#171717] z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">F9</span>
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-white font-bold">NEXUS</div>
              <div className="text-[10px] text-white/40">Financial Terminal</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = currentPath.includes(item.id) ||
            (item.id === 'energy' && currentPath === '/ko/nexus/energy');

          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Membership Badge */}
      {!isCollapsed && (
        <div className="absolute bottom-20 left-3 right-3">
          <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="text-lg">👑</span>
              <div>
                <div className="text-xs text-amber-400 font-bold">PLATINUM</div>
                <div className="text-[10px] text-white/40">Member</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-4 left-3 right-3 p-2 text-white/40 hover:text-white transition-colors"
      >
        {isCollapsed ? '→' : '←'}
      </button>
    </motion.aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME PRICE TICKER
// ═══════════════════════════════════════════════════════════════════════════════

export function PriceTicker() {
  const [priceData, setPriceData] = useState({
    priceKRW: 120,
    change24h: 0,
    volume24h: 0,
  });
  const [prevPrice, setPrevPrice] = useState(120);
  const [v2gStatus, setV2gStatus] = useState<'ACTIVE' | 'STANDBY'>('ACTIVE');

  useEffect(() => {
    const updatePrice = () => {
      const data = getCurrentKausPrice();
      setPrevPrice(priceData.priceKRW);
      setPriceData({
        priceKRW: data.priceKRW,
        change24h: data.change24h,
        volume24h: data.volume24h,
      });
      setV2gStatus(Math.random() > 0.2 ? 'ACTIVE' : 'STANDBY');
    };

    updatePrice();
    const interval = setInterval(updatePrice, 5000);
    return () => clearInterval(interval);
  }, [priceData.priceKRW]);

  const priceUp = priceData.priceKRW > prevPrice;
  const priceDown = priceData.priceKRW < prevPrice;
  const signal = getTradingSignal(priceData.priceKRW);

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-[#171717] border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        {/* KAUS Price */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">KAUS:</span>
              <motion.span
                key={priceData.priceKRW}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={`font-bold ${
                  priceUp ? 'text-emerald-400' : priceDown ? 'text-red-400' : 'text-white'
                }`}
              >
                ₩{priceData.priceKRW.toFixed(1)}
              </motion.span>
              <span className={`text-sm ${priceData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ({priceData.change24h >= 0 ? '+' : ''}{priceData.change24h.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">Vol:</span>
            <span className="text-white/80 text-sm">{(priceData.volume24h / 1000).toFixed(0)}K</span>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />

          {/* Trading Signal */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">Signal:</span>
            <span className={`text-sm font-bold ${
              signal === 'BUY' ? 'text-emerald-400' : signal === 'SELL' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {signal}
            </span>
          </div>
        </div>

        {/* V2G Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">V2G:</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                v2gStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`text-sm font-medium ${
                v2gStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {v2gStatus}
              </span>
            </div>
          </div>

          {/* Live Badge */}
          <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded">
            <span className="text-emerald-400 text-[10px] font-bold">LIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBERSHIP & REFERRAL HEADER BAR
// ═══════════════════════════════════════════════════════════════════════════════

export function MembershipBar() {
  const [referralCode] = useState('F9-SOVR-2026-PLAT');

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(`https://m.fieldnine.io/join?ref=${referralCode}`);
      alert('추천 링크가 복사되었습니다!');
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span className="text-sm font-bold text-amber-600">PLATINUM Member</span>
          </div>
          <div className="text-xs text-[#171717]/40">|</div>
          <div className="text-xs text-[#171717]/60">에너지 20% 할인 적용 중</div>
        </div>

        <button
          onClick={copyReferral}
          className="flex items-center gap-2 px-3 py-1 bg-[#171717] text-white rounded-lg text-xs font-medium hover:bg-[#171717]/80 transition-colors"
        >
          <span>🔗</span>
          <span>추천 링크 복사</span>
        </button>
      </div>
    </div>
  );
}
