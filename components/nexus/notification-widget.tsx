'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 59: NOTIFICATION WIDGET
 * ═══════════════════════════════════════════════════════════════════════════════
 * 실시간 알림 위젯
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationConfig {
  icon: string;
  color: string;
  title: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  config: NotificationConfig;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchNotifications(userId: string, unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
  try {
    const params = new URLSearchParams({ userId });
    if (unreadOnly) params.append('unread', 'true');

    const res = await fetch(`/api/notifications?${params}`);
    const data = await res.json();
    return data.success
      ? { notifications: data.notifications, unreadCount: data.unreadCount }
      : { notifications: [], unreadCount: 0 };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

async function markNotificationRead(notificationId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', notificationId }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

async function markAllRead(userId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead', userId }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION BELL (Header Icon)
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationBellProps {
  userId?: string;
  onClick?: () => void;
}

export function NotificationBell({ userId, onClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadCount = async () => {
      const { unreadCount: count } = await fetchNotifications(userId, true);
      setUnreadCount(count);
    };

    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
    >
      <svg
        className="w-6 h-6 text-white/80"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION PANEL (Dropdown)
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationPanelProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ userId, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { notifications: data, unreadCount: count } = await fetchNotifications(userId);
    setNotifications(data);
    setUnreadCount(count);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId, loadNotifications]);

  const handleMarkRead = async (notificationId: string) => {
    const success = await markNotificationRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    const success = await markAllRead(userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500/20 text-emerald-400',
      amber: 'bg-amber-500/20 text-amber-400',
      red: 'bg-red-500/20 text-red-400',
      cyan: 'bg-cyan-500/20 text-cyan-400',
      purple: 'bg-purple-500/20 text-purple-400',
      blue: 'bg-blue-500/20 text-blue-400',
      orange: 'bg-orange-500/20 text-orange-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">알림</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-400">{unreadCount}개의 새 알림</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block text-2xl mb-2"
                  >
                    ⏳
                  </motion.div>
                  <div>로딩 중...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <div>새로운 알림이 없습니다</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-white/5' : ''
                      }`}
                      onClick={() => !notification.read && handleMarkRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(notification.config.color)}`}>
                          <span className="text-xl">{notification.config.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {notification.config.title}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-800">
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CENTER (Full Component)
// ═══════════════════════════════════════════════════════════════════════════════

interface NotificationCenterProps {
  userId?: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <NotificationBell userId={userId} onClick={() => setIsOpen(!isOpen)} />
      <NotificationPanel userId={userId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATION (Pop-up)
// ═══════════════════════════════════════════════════════════════════════════════

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const getToastStyle = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getToastIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`${getToastStyle(toast.type)} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]`}
          >
            <span className="text-xl">{getToastIcon(toast.type)}</span>
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/70 hover:text-white"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useToast
// ═══════════════════════════════════════════════════════════════════════════════

export function useToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((type: ToastNotification['type'], message: string, duration = 5000) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    dismissToast,
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
  };
}
