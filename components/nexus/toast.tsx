/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 78: COMMERCIAL-GRADE TOAST NOTIFICATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Replaces all alert() calls with premium toast notifications.
 * Features:
 * - Animated entry/exit
 * - Auto-dismiss with progress
 * - Sound & haptic feedback
 * - Multiple toast types
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (toast.type === 'success') {
        navigator.vibrate([20, 50, 20]);
      } else if (toast.type === 'error') {
        navigator.vibrate([50, 30, 50, 30, 50]);
      } else {
        navigator.vibrate(20);
      }
    }

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USE TOAST HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a fallback for server-side or when not in provider
    return {
      toasts: [] as Toast[],
      addToast: () => {},
      removeToast: () => {},
      success: (title: string) => console.log('[Toast] Success:', title),
      error: (title: string) => console.log('[Toast] Error:', title),
      info: (title: string) => console.log('[Toast] Info:', title),
      warning: (title: string) => console.log('[Toast] Warning:', title),
    };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + toast.duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / toast.duration!) * 100;
      setProgress(newProgress);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [toast.duration]);

  const config = {
    success: {
      bg: 'bg-gradient-to-r from-[#00E5FF]/20 to-[#00FF88]/20',
      border: 'border-[#00E5FF]/50',
      icon: '✓',
      iconBg: 'bg-[#00E5FF]',
      progressBg: 'bg-[#00E5FF]',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
      border: 'border-red-500/50',
      icon: '✕',
      iconBg: 'bg-red-500',
      progressBg: 'bg-red-500',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20',
      border: 'border-blue-500/50',
      icon: 'i',
      iconBg: 'bg-blue-500',
      progressBg: 'bg-blue-500',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20',
      border: 'border-amber-500/50',
      icon: '!',
      iconBg: 'bg-amber-500',
      progressBg: 'bg-amber-500',
    },
  }[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        pointer-events-auto w-full max-w-md overflow-hidden
        ${config.bg} backdrop-blur-xl border ${config.border}
        rounded-2xl shadow-2xl
      `}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`${config.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-[#171717] font-bold text-sm">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className="mt-2 text-[#00E5FF] text-xs font-bold hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-white/10">
          <motion.div
            className={`h-full ${config.progressBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default ToastProvider;
