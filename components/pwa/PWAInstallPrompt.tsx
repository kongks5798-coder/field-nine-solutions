'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PWA INSTALL PROMPT COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Phase 30: Total Sovereignty - PWA Installation
 *
 * Displays install prompt for Field Nine NEXUS-X app
 * - Captures beforeinstallprompt event
 * - Shows premium install banner
 * - Tracks installation state
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // Show iOS prompt after delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    // Don't show again for 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  }, []);

  // Check if recently dismissed
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-2xl p-5 shadow-2xl shadow-amber-500/10">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-2xl font-black text-black">F9</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white">NEXUS-X</h3>
            <p className="text-sm text-amber-500/80">Field Nine Empire</p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-400 mt-3 mb-4">
          {isIOS
            ? '홈 화면에 추가하여 앱처럼 사용하세요'
            : '앱을 설치하여 실시간 시장 데이터와 AI 브리핑을 받아보세요'}
        </p>

        {/* Features */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-500">
            실시간 SMP
          </span>
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-500">
            AI 브리핑
          </span>
          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-500">
            오프라인
          </span>
        </div>

        {/* Action Button */}
        {isIOS ? (
          <div className="bg-zinc-800/50 rounded-xl p-3 text-sm text-zinc-300">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>공유 버튼 탭</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>홈 화면에 추가 선택</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg shadow-amber-500/20"
          >
            앱 설치하기
          </button>
        )}

        {/* Sovereignty Badge */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-zinc-500">PLATINUM SOVEREIGNTY MODE</span>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
