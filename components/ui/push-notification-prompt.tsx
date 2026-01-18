/**
 * K-Universal Push Notification Prompt
 * Beautiful permission request UI for push notifications
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Check, Smartphone } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PROMPT_DELAY = 3000; // Show after 3 seconds
const STORAGE_KEY = 'k-universal-push-dismissed';

interface PushNotificationPromptProps {
  locale?: string;
  forceShow?: boolean;
}

export function PushNotificationPrompt({
  locale = 'en',
  forceShow = false,
}: PushNotificationPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isKorean = locale === 'ko';

  useEffect(() => {
    // Check if push notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if already subscribed
    checkSubscription();

    // Check if dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && !forceShow) {
      return;
    }

    // Check if already granted or denied
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    // Show prompt after delay
    const timer = setTimeout(() => setIsVisible(true), PROMPT_DELAY);
    return () => clearTimeout(timer);
  }, [forceShow]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      // Ignore errors
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setError(isKorean ? '알림 권한이 거부되었습니다' : 'Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
      setIsVisible(false);

      // Show success notification
      new Notification('K-Universal', {
        body: isKorean ? '알림이 활성화되었습니다!' : 'Notifications enabled!',
        icon: '/icon-192.png',
      });
    } catch (err) {
      console.error('Push subscription error:', err);
      setError(isKorean ? '알림 설정 중 오류가 발생했습니다' : 'Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  const handleLater = () => {
    // Don't persist, just hide for this session
    setIsVisible(false);
  };

  if (!isVisible || isSubscribed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
      >
        <div className="bg-[#12121A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">
                  {isKorean ? '알림 받기' : 'Stay Updated'}
                </h3>
                <p className="text-white/60 text-sm">
                  {isKorean ? '실시간 알림을 받아보세요' : 'Never miss important updates'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-2 mb-4">
              <NotificationBenefit
                icon={Smartphone}
                text={isKorean ? '택시 도착 알림' : 'Taxi arrival alerts'}
              />
              <NotificationBenefit
                icon={Smartphone}
                text={isKorean ? '배달 상태 업데이트' : 'Delivery status updates'}
              />
              <NotificationBenefit
                icon={Smartphone}
                text={isKorean ? '특별 프로모션 & 할인' : 'Special promos & discounts'}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLater}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium transition-colors"
              >
                {isKorean ? '나중에' : 'Later'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    {isKorean ? '알림 켜기' : 'Enable'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function NotificationBenefit({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
        <Check className="w-3 h-3 text-green-400" />
      </div>
      <span className="text-white/70 text-sm">{text}</span>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// Hook to manage push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      // Ignore
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setIsSubscribed(false);
      return true;
    } catch {
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
  };
}
