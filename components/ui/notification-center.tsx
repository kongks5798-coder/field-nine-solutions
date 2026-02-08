/**
 * K-Universal Notification Center
 * Dropdown notification panel with real-time updates
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  CreditCard,
  Car,
  ShoppingBag,
  AlertCircle,
  Gift,
  Sparkles,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'payment' | 'taxi' | 'delivery' | 'alert' | 'promo' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Demo notifications
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'promo',
    title: 'Product Hunt Launch!',
    message: 'K-Universal launches on Jan 21st. Support us!',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Your wallet has been topped up with ₩50,000',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Welcome to K-Universal!',
    message: 'Complete your KYC to unlock all features',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
];

const notificationIcons = {
  payment: CreditCard,
  taxi: Car,
  delivery: ShoppingBag,
  alert: AlertCircle,
  promo: Gift,
  system: Sparkles,
};

const notificationColors = {
  payment: 'bg-green-500/20 text-green-400',
  taxi: 'bg-yellow-500/20 text-yellow-400',
  delivery: 'bg-orange-500/20 text-orange-400',
  alert: 'bg-red-500/20 text-red-400',
  promo: 'bg-purple-500/20 text-purple-400',
  system: 'bg-blue-500/20 text-blue-400',
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-[#1A1A24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const colorClass = notificationColors[notification.type];

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex items-start gap-3 p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-white/60 text-xs mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10">
                <button
                  onClick={clearAll}
                  className="w-full py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
