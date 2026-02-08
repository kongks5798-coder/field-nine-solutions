/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 71: NETWORK STATUS DETECTION & OFFLINE BANNER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 실시간 네트워크 상태 감지
 * - 오프라인 전환 시 배너 표시
 * - 연결 복구 시 자동 숨김
 * - 연결 품질 표시
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface NetworkState {
  isOnline: boolean;
  quality: ConnectionQuality;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
}

export function NetworkStatusBanner() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    quality: 'excellent',
  });
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

    if (!navigator.onLine) {
      setNetworkState({
        isOnline: false,
        quality: 'offline',
      });
      setShowBanner(true);
      setWasOffline(true);
      return;
    }

    if (connection) {
      let quality: ConnectionQuality = 'excellent';

      // Determine quality based on effective type and downlink
      if (connection.effectiveType === '4g' && (connection.downlink || 10) >= 5) {
        quality = 'excellent';
      } else if (connection.effectiveType === '4g') {
        quality = 'good';
      } else if (connection.effectiveType === '3g') {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      setNetworkState({
        isOnline: true,
        quality,
        downlink: connection.downlink,
        rtt: connection.rtt,
        effectiveType: connection.effectiveType,
      });

      // Show recovery banner if was offline
      if (wasOffline) {
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, 3000);
      }
    } else {
      setNetworkState({
        isOnline: true,
        quality: 'good',
      });

      if (wasOffline) {
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, 3000);
      }
    }
  }, [wasOffline]);

  useEffect(() => {
    // Initial check
    updateNetworkInfo();

    // Event listeners
    const handleOnline = () => {
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setNetworkState({
        isOnline: false,
        quality: 'offline',
      });
      setShowBanner(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network change listener
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  const handleDismiss = () => {
    if (networkState.isOnline) {
      setShowBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] pt-safe"
        >
          <div
            className={`mx-2 mt-2 rounded-xl shadow-lg backdrop-blur-sm ${
              networkState.isOnline
                ? 'bg-emerald-500/95 text-white'
                : 'bg-red-500/95 text-white'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  networkState.isOnline ? 'bg-white/20' : 'bg-white/20'
                }`}>
                  {networkState.isOnline ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lg"
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-lg"
                    >
                      📡
                    </motion.span>
                  )}
                </div>

                {/* Status Text */}
                <div>
                  <div className="font-bold text-sm">
                    {networkState.isOnline ? 'Connection Restored' : 'No Internet Connection'}
                  </div>
                  <div className="text-xs opacity-80">
                    {networkState.isOnline
                      ? '모든 기능이 정상 작동합니다'
                      : '오프라인 모드로 전환되었습니다'}
                  </div>
                </div>
              </div>

              {/* Dismiss Button (only when online) */}
              {networkState.isOnline && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  ✕
                </motion.button>
              )}
            </div>

            {/* Connection Quality Bar (offline) */}
            {!networkState.isOnline && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 rounded-full bg-white/50"
                    />
                  ))}
                  <span className="text-xs opacity-70 ml-1">재연결 시도 중...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact Network Indicator - 상태바에 표시되는 작은 인디케이터
 */
export function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
    >
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-white"
      />
      <span className="font-medium">Offline</span>
    </motion.div>
  );
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [quality, setQuality] = useState<ConnectionQuality>('excellent');

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);

      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      if (connection) {
        if (connection.effectiveType === '4g') {
          setQuality('excellent');
        } else if (connection.effectiveType === '3g') {
          setQuality('fair');
        } else {
          setQuality('poor');
        }
      }
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return { isOnline, quality };
}

// Type declaration for Network Information API
interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  onchange: EventListener;
}
