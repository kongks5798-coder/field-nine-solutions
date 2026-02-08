'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: MICRO-INTERACTION & FEEDBACK SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 0.1초 단위 유려한 트랜지션
 * 진행 상태 표시 & 에러 핸들링
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface ProgressState {
  isActive: boolean;
  progress: number;
  message: string;
  subMessage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UX WRITING (정중하고 명확한 에러 메시지)
// ═══════════════════════════════════════════════════════════════════════════════

export const UX_MESSAGES = {
  // 잔액 부족
  INSUFFICIENT_BALANCE: {
    title: '잔액 확인 필요',
    message: '보스, 현재 잔액이 부족합니다. 지갑에서 잔액을 확인해주세요.',
  },
  // API 에러
  API_ERROR: {
    title: '요청 처리 실패',
    message: '보스, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  // 네트워크 에러
  NETWORK_ERROR: {
    title: '네트워크 연결 확인',
    message: '보스, 인터넷 연결을 확인해주세요.',
  },
  // 인증 필요
  AUTH_REQUIRED: {
    title: '로그인 필요',
    message: '보스, 이 기능을 사용하려면 로그인이 필요합니다.',
  },
  // 권한 부족
  PERMISSION_DENIED: {
    title: '권한 부족',
    message: '보스, 이 기능은 상위 구독 티어에서 사용 가능합니다.',
  },
  // Rate Limit
  RATE_LIMITED: {
    title: 'API 호출 한도 초과',
    message: '보스, 잠시 후 다시 시도해주세요. 또는 Pro 플랜으로 업그레이드하시면 더 많은 호출이 가능합니다.',
  },
  // 성공
  SUCCESS: {
    title: '완료',
    message: '보스, 성공적으로 처리되었습니다.',
  },
  // 결제 성공
  PAYMENT_SUCCESS: {
    title: '결제 완료',
    message: '보스, 결제가 성공적으로 완료되었습니다. 감사합니다!',
  },
  // Sandbox 테스트
  SANDBOX_SUCCESS: {
    title: 'Sandbox 테스트 성공',
    message: '보스, API 테스트가 정상적으로 완료되었습니다.',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  showUXToast: (key: keyof typeof UX_MESSAGES, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const showUXToast = useCallback((key: keyof typeof UX_MESSAGES, type: ToastType = 'error') => {
    const uxMessage = UX_MESSAGES[key];
    showToast(type, uxMessage.title, uxMessage.message);
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, showUXToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const toastVariants: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 100, scale: 0.9 },
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'border-emerald-500 bg-emerald-500/10',
  error: 'border-red-500 bg-red-500/10',
  warning: 'border-amber-500 bg-amber-500/10',
  info: 'border-cyan-500 bg-cyan-500/10',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={`relative p-4 rounded-xl border-l-4 backdrop-blur-xl ${TOAST_COLORS[toast.type]}`}
    >
      <button
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors"
      >
        ✕
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="text-xl">{TOAST_ICONS[toast.type]}</span>
        <div>
          <h4 className="font-bold text-white text-sm">{toast.title}</h4>
          <p className="text-white/70 text-sm mt-1">{toast.message}</p>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-white/30"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH PROGRESS INDICATOR (0.1초 단위)
// ═══════════════════════════════════════════════════════════════════════════════

interface SmoothProgressProps {
  isActive: boolean;
  progress: number; // 0-100
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export function SmoothProgress({ isActive, progress, message, subMessage, onComplete }: SmoothProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // 0.1초 단위 부드러운 진행
  useEffect(() => {
    if (!isActive) {
      setDisplayProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev >= progress) return progress;
        const step = Math.max(0.5, (progress - prev) / 10);
        return Math.min(progress, prev + step);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, progress]);

  // Complete callback
  useEffect(() => {
    if (displayProgress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#171717] rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10"
          >
            {/* Animated Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#171717] flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/50">{message || '처리 중...'}</span>
                <span className="text-emerald-400 font-bold">{displayProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  style={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>

            {/* Sub Message */}
            {subMessage && (
              <p className="text-center text-white/40 text-sm">{subMessage}</p>
            )}

            {/* Status Steps */}
            <div className="mt-6 space-y-2">
              {[
                { threshold: 0, label: '요청 준비 중...' },
                { threshold: 30, label: '서버 연결 중...' },
                { threshold: 60, label: '데이터 처리 중...' },
                { threshold: 90, label: '완료 중...' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: displayProgress >= step.threshold ? 1 : 0.3,
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <motion.span
                    animate={{
                      scale: displayProgress >= step.threshold ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={displayProgress >= step.threshold ? 'text-emerald-400' : 'text-white/30'}
                  >
                    {displayProgress >= step.threshold + 20 ? '✓' : '○'}
                  </motion.span>
                  <span className={displayProgress >= step.threshold ? 'text-white' : 'text-white/30'}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON WITH MICRO-INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function InteractiveButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
}: InteractiveButtonProps) {
  const baseClasses = 'relative font-bold rounded-xl overflow-hidden transition-all duration-200';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* Shimmer effect on hover */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Content */}
      <span className={`relative flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {children}
      </span>

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-xl"
          >
            ⚡
          </motion.span>
        </motion.div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB TRANSITION
// ═══════════════════════════════════════════════════════════════════════════════

interface TabTransitionProps {
  tabs: { id: string; label: string; icon?: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TabTransition({ tabs, activeTab, onTabChange }: TabTransitionProps) {
  return (
    <div className="relative flex bg-white/5 rounded-xl p-1">
      {/* Active indicator */}
      <motion.div
        className="absolute inset-y-1 bg-white/10 rounded-lg"
        initial={false}
        animate={{
          x: tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length) + '%',
          width: `${100 / tabs.length}%`,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        style={{ left: '4px', right: '4px' }}
      />

      {tabs.map(tab => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
            activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD HOVER EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function HoverCard({ children, className = '', onClick }: HoverCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        y: -4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`bg-[#171717] rounded-2xl border border-white/10 overflow-hidden cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUCCESS ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
          className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-5xl">✓</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-white"
        >
          완료되었습니다!
        </motion.h2>
      </motion.div>
    </motion.div>
  );
}
