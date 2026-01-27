/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: OFFLINE INDICATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * Visual indicator for offline status
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineDetection, useNetworkStatus } from '@/lib/pwa/hooks';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOfflineDetection();
  const network = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Show "reconnected" message briefly when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Only show when offline or just reconnected
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-500 to-orange-500"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-white">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <span className="text-sm font-medium">Offline Mode</span>
            <span className="text-xs text-white/80">- Using cached data</span>
          </div>
        </motion.div>
      )}

      {/* Reconnected Toast */}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-green-500 to-emerald-500"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Back Online</span>
            {network.effectiveType && (
              <span className="text-xs text-white/80">- {network.effectiveType.toUpperCase()}</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Mini offline badge - 작은 오프라인 인디케이터
 */
export function OfflineBadge({ className = '' }: { className?: string }) {
  const { isOnline } = useOfflineDetection();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium ${className}`}
    >
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
      Offline
    </motion.div>
  );
}

/**
 * Network quality indicator
 */
export function NetworkQualityIndicator({ className = '' }: { className?: string }) {
  const network = useNetworkStatus();

  if (!network.isOnline) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex gap-0.5">
          <span className="w-1 h-2 bg-red-500 rounded-full" />
          <span className="w-1 h-3 bg-gray-300 rounded-full" />
          <span className="w-1 h-4 bg-gray-300 rounded-full" />
          <span className="w-1 h-5 bg-gray-300 rounded-full" />
        </div>
        <span className="text-xs text-red-500 font-medium">Offline</span>
      </div>
    );
  }

  const getQualityBars = () => {
    switch (network.effectiveType) {
      case '4g':
        return (
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-green-500 rounded-full" />
            <span className="w-1 h-3 bg-green-500 rounded-full" />
            <span className="w-1 h-4 bg-green-500 rounded-full" />
            <span className="w-1 h-5 bg-green-500 rounded-full" />
          </div>
        );
      case '3g':
        return (
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-yellow-500 rounded-full" />
            <span className="w-1 h-3 bg-yellow-500 rounded-full" />
            <span className="w-1 h-4 bg-yellow-500 rounded-full" />
            <span className="w-1 h-5 bg-gray-300 rounded-full" />
          </div>
        );
      case '2g':
        return (
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-orange-500 rounded-full" />
            <span className="w-1 h-3 bg-orange-500 rounded-full" />
            <span className="w-1 h-4 bg-gray-300 rounded-full" />
            <span className="w-1 h-5 bg-gray-300 rounded-full" />
          </div>
        );
      case 'slow-2g':
        return (
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-red-500 rounded-full" />
            <span className="w-1 h-3 bg-gray-300 rounded-full" />
            <span className="w-1 h-4 bg-gray-300 rounded-full" />
            <span className="w-1 h-5 bg-gray-300 rounded-full" />
          </div>
        );
      default:
        return (
          <div className="flex gap-0.5">
            <span className="w-1 h-2 bg-gray-400 rounded-full" />
            <span className="w-1 h-3 bg-gray-400 rounded-full" />
            <span className="w-1 h-4 bg-gray-400 rounded-full" />
            <span className="w-1 h-5 bg-gray-400 rounded-full" />
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {getQualityBars()}
      {network.effectiveType && (
        <span className="text-xs text-gray-500 font-medium uppercase">
          {network.effectiveType}
        </span>
      )}
    </div>
  );
}
