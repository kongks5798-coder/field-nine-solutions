/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 70: PWA INSTALL PROMPT COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 모바일 PWA 설치 프롬프트
 * - beforeinstallprompt 이벤트 처리
 * - iOS Safari 가이드
 * - 설치 완료 추적
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show iOS prompt after delay (if not standalone and not dismissed)
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  }, []);

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Prompt Card */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#171717] to-[#2d2d2d] p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">NEXUS Empire</h3>
                    <p className="text-sm text-white/70">Install for the best experience</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {isIOS ? (
                  // iOS Instructions
                  <div className="space-y-4">
                    <p className="text-sm text-[#171717]/70 text-center">
                      홈 화면에 추가하여 앱처럼 사용하세요
                    </p>

                    <div className="bg-[#F9F9F7] rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
                          1
                        </div>
                        <span className="text-sm text-[#171717]">
                          하단 <span className="font-bold">공유 버튼</span> 탭
                        </span>
                        <span className="ml-auto text-xl">📤</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
                          2
                        </div>
                        <span className="text-sm text-[#171717]">
                          <span className="font-bold">"홈 화면에 추가"</span> 선택
                        </span>
                        <span className="ml-auto text-xl">➕</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
                          3
                        </div>
                        <span className="text-sm text-[#171717]">
                          <span className="font-bold">"추가"</span> 버튼 탭
                        </span>
                        <span className="ml-auto text-xl">✓</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Android/Chrome Install
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-center">
                        <span className="text-2xl">📱</span>
                        <p className="text-xs text-[#171717]/50 mt-1">앱 설치</p>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl">⚡</span>
                        <p className="text-xs text-[#171717]/50 mt-1">빠른 접근</p>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl">🔔</span>
                        <p className="text-xs text-[#171717]/50 mt-1">알림</p>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl">📴</span>
                        <p className="text-xs text-[#171717]/50 mt-1">오프라인</p>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleInstall}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30"
                    >
                      홈 화면에 추가
                    </motion.button>
                  </div>
                )}

                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-3 py-3 text-[#171717]/50 text-sm"
                >
                  나중에
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Mini Install Banner - 상단에 표시되는 작은 배너
 */
export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) return;

    // Check if dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-[#171717] to-[#2d2d2d] text-white overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-medium">NEXUS 앱 설치</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-white text-[#171717] text-xs font-bold rounded-full"
            >
              설치
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
