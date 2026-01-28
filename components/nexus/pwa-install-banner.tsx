/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 79: PWA INSTALL BANNER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 우아한 모바일 PWA 설치 배너
 * "앱으로 설치하여 실시간 시세를 확인하세요"
 *
 * Features:
 * - Detects if app is installable
 * - Shows elegant bottom sheet banner
 * - Guides iOS users through Add to Home Screen
 * - Tesla-style warm ivory design
 * - Dismissible with localStorage persistence
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallBannerProps {
  /** Delay before showing banner (ms) */
  delay?: number;
  /** Don't show again for X days after dismissal */
  dismissDays?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'pwa_install_dismissed';
const INSTALLED_KEY = 'pwa_installed';

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for standalone mode
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;

  return false;
}

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);

  return isIOS && isWebkit && !isChrome && !isFirefox;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function PWAInstallBanner({ delay = 3000, dismissDays = 7 }: PWAInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  // Check if should show banner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show if already installed
    if (isStandalone()) {
      localStorage.setItem(INSTALLED_KEY, 'true');
      return;
    }

    // Don't show if dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt));
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < dismissDays) return;
    }

    // Only show on mobile
    if (!isMobileDevice()) return;

    // Check if iOS
    setIsIOS(isIOSSafari());

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, dismissDays]);

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt, isIOS]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
    setShowIOSGuide(false);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {/* Backdrop for iOS Guide */}
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          onClick={() => setShowIOSGuide(false)}
        />
      )}

      {/* Main Banner */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 safe-area-pb"
      >
        <div className="max-w-lg mx-auto">
          {/* iOS Installation Guide */}
          {showIOSGuide ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#F9F9F7] rounded-3xl p-6 shadow-2xl border border-[#171717]/10"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-[#171717]">홈 화면에 추가</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-[#171717]/5 flex items-center justify-center"
                >
                  <span className="text-[#171717]/60">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-[#171717]">공유 버튼 탭</p>
                    <p className="text-sm text-[#171717]/60">
                      Safari 하단의 <span className="inline-block w-5 h-5 align-middle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14M19 12l-7-7-7 7" />
                        </svg>
                      </span> 버튼을 탭하세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-[#171717]">&quot;홈 화면에 추가&quot; 선택</p>
                    <p className="text-sm text-[#171717]/60">
                      스크롤하여 &quot;홈 화면에 추가&quot; 옵션을 찾으세요
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-[#171717]">&quot;추가&quot; 탭</p>
                    <p className="text-sm text-[#171717]/60">
                      우측 상단의 &quot;추가&quot; 버튼을 탭하여 완료
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full mt-4 py-3 text-[#171717]/60 text-sm"
              >
                나중에 하기
              </button>
            </motion.div>
          ) : (
            /* Standard Banner */
            <div className="bg-[#F9F9F7] rounded-3xl p-5 shadow-2xl border border-[#171717]/10">
              <div className="flex items-center gap-4">
                {/* App Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#171717] flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">⚡</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#171717] text-lg">Field Nine 앱</h3>
                  <p className="text-sm text-[#171717]/60 truncate">
                    앱으로 설치하여 실시간 시세를 확인하세요
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleDismiss}
                    className="w-10 h-10 rounded-full bg-[#171717]/5 flex items-center justify-center"
                  >
                    <span className="text-[#171717]/40 text-lg">✕</span>
                  </button>
                  <button
                    onClick={handleInstall}
                    className="px-5 py-2.5 bg-[#171717] text-[#F9F9F7] rounded-xl font-bold text-sm"
                  >
                    설치
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#171717]/5">
                <div className="flex items-center gap-1.5 text-xs text-[#171717]/60">
                  <span>📈</span>
                  <span>실시간 알림</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#171717]/60">
                  <span>⚡</span>
                  <span>빠른 접속</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#171717]/60">
                  <span>🔒</span>
                  <span>오프라인 지원</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR MANUAL CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    canInstall: canInstall || isIOSSafari(),
    isInstalled,
    isIOS: isIOSSafari(),
    install,
  };
}

export default PWAInstallBanner;
