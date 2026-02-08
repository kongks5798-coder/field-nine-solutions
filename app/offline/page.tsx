/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 70: NEXUS EMPIRE OFFLINE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 오프라인 상태에서 표시되는 Nexus 브랜딩 페이지
 * - 자동 재연결 감지
 * - 캐시된 데이터 표시
 * - Nexus 디자인 시스템 적용
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [cachedBalance, setCachedBalance] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    // Try to get cached KAUS balance
    try {
      const cached = localStorage.getItem('kaus-balance');
      if (cached) setCachedBalance(cached);
    } catch {
      // Ignore localStorage errors
    }

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = '/ko/nexus/energy';
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleGoToEnergy = () => {
    window.location.href = '/ko/nexus/energy';
  };

  // Online - Reconnecting state
  if (isOnline) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center"
          >
            <span className="text-3xl">⚡</span>
          </motion.div>
          <h2 className="text-xl font-bold text-[#171717] mb-2">
            Connection Restored
          </h2>
          <p className="text-[#171717]/60 text-sm">
            Redirecting to Energy Command Center...
          </p>
        </motion.div>
      </div>
    );
  }

  // Offline state
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F9F7] to-[#E5E5E0] flex items-center justify-center p-4 pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Hero Section */}
        <div className="text-center mb-6">
          {/* Animated Logo */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#171717] to-[#3d3d3d] flex items-center justify-center shadow-lg"
          >
            <span className="text-4xl">🌐</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-black text-[#171717] mb-2">
            NEXUS Offline Mode
          </h1>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-amber-500"
            />
            네트워크 연결 대기 중
          </div>
        </div>

        {/* Cached Data Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-[#171717]/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#171717]">캐시된 데이터</h3>
            <span className="text-xs text-[#171717]/40">Last Sync</span>
          </div>

          {/* KAUS Balance */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-xl">🪙</span>
              </div>
              <div>
                <div className="text-xs text-[#171717]/50">KAUS Balance</div>
                <div className="text-lg font-black text-[#171717]">
                  {cachedBalance ? `${parseFloat(cachedBalance).toLocaleString()} KAUS` : '— KAUS'}
                </div>
              </div>
            </div>
          </div>

          {/* Available Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-xs">✓</span>
              </span>
              <span className="text-[#171717]/70">캐시된 페이지 접근</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-xs">✓</span>
              </span>
              <span className="text-[#171717]/70">저장된 잔액 확인</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xs">⏳</span>
              </span>
              <span className="text-[#171717]/70">거래 대기열 (연결 후 동기화)</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            onClick={handleRetry}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-[#171717] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <motion.span
              animate={retryCount > 0 ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
            >
              🔄
            </motion.span>
            다시 연결 시도
            {retryCount > 0 && (
              <span className="text-xs text-white/50">({retryCount})</span>
            )}
          </motion.button>

          <motion.button
            onClick={handleGoToEnergy}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white border border-[#171717]/10 text-[#171717] font-bold rounded-xl flex items-center justify-center gap-2"
          >
            ⚡ Energy Dashboard (Cached)
          </motion.button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#171717]/40 leading-relaxed">
            오프라인 모드에서는 캐시된 데이터만 표시됩니다.<br />
            연결이 복구되면 자동으로 동기화됩니다.
          </p>
        </div>

        {/* Connection Animation */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex items-center justify-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 rounded-full bg-[#171717]/30"
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
