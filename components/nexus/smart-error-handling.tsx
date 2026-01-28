/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 77: SMART ERROR HANDLING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Commercial-grade error handling:
 * - Elegant error page instead of white screen
 * - "잠시 에너지 망을 재정비 중입니다" message with recovery button
 * - In-place login popup for protected actions
 *
 * Features:
 * - Animated energy grid illustration
 * - Glassmorphism design
 * - Auto-retry mechanism
 * - Session persistence check
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// ELEGANT ERROR PAGE
// ═══════════════════════════════════════════════════════════════════════════════

interface EnergyErrorPageProps {
  error?: Error;
  reset?: () => void;
  message?: string;
}

export function EnergyErrorPage({ error, reset, message }: EnergyErrorPageProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Auto-retry countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return 30;
        if (prev <= 1) {
          handleRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    if (reset) {
      reset();
    } else {
      router.refresh();
    }
    setTimeout(() => setIsRetrying(false), 2000);
  }, [reset, router]);

  const handleGoHome = () => {
    router.push('/ko/nexus');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent"
              style={{
                top: `${i * 5}%`,
                left: 0,
                width: '100%',
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
                scaleX: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 3 + i * 0.2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Illustration */}
        <motion.div
          className="relative w-48 h-48 mx-auto mb-8"
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Orbiting rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border border-[#00E5FF]/30 rounded-full"
              style={{
                transform: `rotateX(${60 + i * 20}deg) rotateZ(${i * 30}deg)`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
              }}
            />
          ))}

          {/* Center core */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, #00E5FF 0%, #00E5FF00 70%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Pulsing icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">
            ⚡
          </div>
        </motion.div>

        {/* Card */}
        <div className="glass-card-glow rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-black text-white mb-3">
            잠시 에너지 망을 재정비 중입니다
          </h1>

          <p className="text-white/60 mb-6">
            글로벌 에너지 네트워크를 최적화하고 있습니다.
            <br />
            곧 정상 서비스가 재개됩니다.
          </p>

          {/* Error details (development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left">
              <div className="text-xs text-red-400 font-mono break-all">
                {error.message || message}
              </div>
            </div>
          )}

          {/* Auto-retry countdown */}
          {countdown !== null && (
            <div className="mb-6 text-sm text-white/40">
              자동 재시도까지 <span className="text-[#00E5FF] font-bold">{countdown}</span>초
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-4 rounded-2xl font-bold text-lg text-[#171717] disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #00FF88 100%)',
                boxShadow: '0 0 30px rgba(0,229,255,0.4)',
              }}
            >
              {isRetrying ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⚡
                  </motion.span>
                  재연결 중...
                </span>
              ) : (
                '다시 시도하기'
              )}
            </motion.button>

            <button
              onClick={handleGoHome}
              className="w-full py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-sm">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-amber-500"
          />
          시스템 상태 점검 중
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-PLACE LOGIN POPUP
// ═══════════════════════════════════════════════════════════════════════════════

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export function LoginPopup({ isOpen, onClose, onSuccess, message }: LoginPopupProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Store current URL for redirect after login
    localStorage.setItem('loginRedirectUrl', window.location.pathname);
    router.push('/ko/auth/login?provider=google');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      // Magic link login
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        // Show success message
        setEmail('');
        alert('로그인 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.');
        onClose();
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm glass-modal rounded-3xl p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00FF88]/20 flex items-center justify-center">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-white">로그인이 필요합니다</h2>
              <p className="text-sm text-white/60 mt-2">
                {message || '이 기능을 사용하려면 로그인해주세요'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            {/* Google login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-white text-[#171717] font-medium flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? '로그인 중...' : 'Google로 계속하기'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/40">또는</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email login */}
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full mt-3 py-3 rounded-xl glass-button text-white font-medium disabled:opacity-50"
              >
                이메일로 로그인 링크 받기
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-white/40">
              로그인하면 <span className="text-[#00E5FF]">서비스 약관</span>에 동의하게 됩니다.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK FOR LOGIN REQUIREMENT
// ═══════════════════════════════════════════════════════════════════════════════

export function useRequireLogin() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireLogin = useCallback((action: () => void) => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/kaus/user-balance');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // User is logged in, execute action
            action();
            return;
          }
        }
      } catch {}

      // User not logged in, show popup
      setPendingAction(() => action);
      setShowLoginPopup(true);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginPopup(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleLoginClose = useCallback(() => {
    setShowLoginPopup(false);
    setPendingAction(null);
  }, []);

  return {
    showLoginPopup,
    requireLogin,
    LoginPopupComponent: (
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={handleLoginClose}
        onSuccess={handleLoginSuccess}
      />
    ),
  };
}

export default EnergyErrorPage;
