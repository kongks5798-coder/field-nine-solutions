/**
 * K-Universal Offline Page
 * 오프라인 상태에서 표시되는 페이지
 */

'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect when back online
      setTimeout(() => {
        window.location.href = '/ko/dashboard';
      }, 1000);
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

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/ko/dashboard';
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-8 h-8 text-green-600" />
            </motion.div>
          </div>
          <h2 className="text-xl font-semibold text-[#171717] mb-2">
            연결 복구됨
          </h2>
          <p className="text-[#737373]">
            대시보드로 이동 중...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F9F7] to-[#E5E5E0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#171717]/10 flex items-center justify-center"
        >
          <WifiOff className="w-12 h-12 text-[#171717]" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#171717] mb-2">
          오프라인 상태입니다
        </h1>

        {/* Description */}
        <p className="text-[#737373] mb-8 leading-relaxed">
          인터넷 연결이 끊어졌습니다.<br />
          일부 기능이 제한될 수 있습니다.
        </p>

        {/* Available Features */}
        <div className="bg-white rounded-2xl p-6 mb-6 text-left shadow-sm">
          <h3 className="font-semibold text-[#171717] mb-3">
            오프라인에서 사용 가능:
          </h3>
          <ul className="space-y-2 text-sm text-[#737373]">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              캐시된 페이지 보기
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              저장된 정보 확인
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              결제 및 예약 (연결 후 동기화)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleRefresh}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#171717] text-white rounded-xl font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            다시 시도
          </motion.button>

          <motion.button
            onClick={handleGoHome}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#E5E5E0] text-[#171717] rounded-xl font-medium"
          >
            <Home className="w-5 h-5" />
            홈으로
          </motion.button>
        </div>

        {/* Connection Status */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[#737373]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          연결 대기 중...
        </div>
      </motion.div>
    </div>
  );
}
