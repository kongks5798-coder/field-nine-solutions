'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, Sparkles } from 'lucide-react';

interface UpdateInfo {
  version: string;
  available: boolean;
  changelog?: string;
  forceUpdate?: boolean;
}

/**
 * Tesla-style OTA Update Notifier
 * 자동으로 새 버전을 감지하고 사용자에게 알림
 */
export function UpdateNotifier() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 버전 체크 (5분마다)
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/version/check', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.available && data.version !== getCurrentVersion()) {
            setUpdateInfo({
              version: data.version,
              available: true,
              changelog: data.changelog,
              forceUpdate: data.forceUpdate || false,
            });
          }
        }
      } catch (error) {
        console.warn('[UpdateNotifier] 버전 체크 실패:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // 초기 체크
    checkForUpdates();

    // 5분마다 체크
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    // Service Worker 업데이트 감지
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // 새 Service Worker가 활성화되면 페이지 새로고침
        window.location.reload();
      });
    }

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Service Worker 업데이트
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      }

      // 캐시 삭제 및 새로고침
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }

      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('[UpdateNotifier] 업데이트 실패:', error);
      setIsUpdating(false);
    }
  };

  const getCurrentVersion = (): string => {
    // package.json의 version 또는 환경 변수에서 가져오기
    return process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
  };

  return (
    <AnimatePresence>
      {updateInfo && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-2 border-cyan-500/50 rounded-2xl shadow-2xl p-6 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#F5F5F0] mb-1">
                  새 버전이 사용 가능합니다
                </h3>
                <p className="text-sm text-[#F5F5F0]/70 mb-4">
                  버전 {updateInfo.version}이 출시되었습니다.
                  {updateInfo.changelog && (
                    <span className="block mt-1 text-xs text-cyan-400/80">
                      {updateInfo.changelog}
                    </span>
                  )}
                </p>

                {updateInfo.forceUpdate ? (
                  <p className="text-xs text-amber-400 mb-4">
                    ⚠️ 필수 업데이트입니다. 계속 사용하려면 업데이트가 필요합니다.
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>업데이트 중...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>지금 업데이트</span>
                      </>
                    )}
                  </motion.button>

                  {!updateInfo.forceUpdate && (
                    <motion.button
                      onClick={() => setUpdateInfo(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-[#0A0A0A] border border-cyan-500/30 text-[#F5F5F0] text-sm font-medium rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    >
                      나중에
                    </motion.button>
                  )}
                </div>
              </div>

              {!updateInfo.forceUpdate && (
                <button
                  onClick={() => setUpdateInfo(null)}
                  className="p-1 hover:bg-cyan-500/20 rounded-lg transition-colors flex-shrink-0"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-[#F5F5F0]" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
