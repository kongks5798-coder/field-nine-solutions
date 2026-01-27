/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: PWA CLIENT HOOKS
 * ═══════════════════════════════════════════════════════════════════════════════
 * React hooks for PWA functionality
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isReady: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

interface NetworkState {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE WORKER HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useServiceWorker(): ServiceWorkerState & {
  update: () => Promise<void>;
  skipWaiting: () => void;
  clearCache: () => void;
} {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isReady: false,
    registration: null,
    updateAvailable: false,
  });

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Check if SW is ready
    navigator.serviceWorker.ready.then((registration) => {
      setState((prev) => ({
        ...prev,
        isReady: true,
        registration,
      }));
    });

    // Handle controller change (new SW activated)
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update();
    }
  }, [state.registration]);

  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.registration]);

  const clearCache = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, []);

  return { ...state, update, skipWaiting, clearCache };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL PROMPT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useInstallPrompt(): {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
} {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const isIOS = typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) return false;

    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      if (outcome === 'accepted') {
        setCanInstall(false);
        deferredPromptRef.current = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, []);

  return { canInstall, isInstalled, isIOS, promptInstall };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function usePushNotifications(): {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  sendTestNotification: () => void;
} {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator &&
                      'PushManager' in window &&
                      'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    // Get current permission
    setPermission(Notification.permission);

    // Check existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registrationRef.current = registration;

      registration.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!registrationRef.current) return null;

    try {
      // Request permission first
      const perm = await requestPermission();
      if (perm !== 'granted') return null;

      // Get VAPID public key from server
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        console.error('[PWA] Failed to get VAPID key');
        return null;
      }

      const { publicKey } = await response.json();

      // Subscribe to push
      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription error:', error);
      return null;
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registrationRef.current) return false;

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (!subscription) return true;

      // Unsubscribe
      await subscription.unsubscribe();

      // Remove from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('[PWA] Push unsubscribe error:', error);
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    if (!isSupported || permission !== 'granted') return;

    new Notification('NEXUS Empire', {
      body: 'Push notifications are working!',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'test-notification',
    });
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK STATUS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as unknown as {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        }
      }).connection;

      setState({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
      });
    };

    updateNetworkInfo();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const connection = (navigator as unknown as {
      connection?: {
        addEventListener: (event: string, handler: () => void) => void;
        removeEventListener: (event: string, handler: () => void) => void;
      }
    }).connection;

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return state;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE DETECTION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useOfflineDetection(): {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
} {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setOfflineSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, offlineSince };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useBackgroundSync(): {
  isSupported: boolean;
  queueTransaction: (type: string, data: Record<string, unknown>) => Promise<void>;
  requestSync: (tag: string) => Promise<void>;
} {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'SyncManager' in window;
    setIsSupported(supported);
  }, []);

  const queueTransaction = useCallback(async (
    type: string,
    data: Record<string, unknown>
  ): Promise<void> => {
    if (!navigator.serviceWorker.controller) {
      console.warn('[PWA] No active service worker');
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_TRANSACTION',
      payload: { type, ...data },
    });
  }, []);

  const requestSync = useCallback(async (tag: string): Promise<void> => {
    if (!isSupported) return;

    const registration = await navigator.serviceWorker.ready;
    await (registration as unknown as {
      sync: { register: (tag: string) => Promise<void> }
    }).sync.register(tag);
  }, [isSupported]);

  return { isSupported, queueTransaction, requestSync };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE NOTIFICATION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useUpdateNotification(): {
  updateAvailable: boolean;
  applyUpdate: () => void;
  dismissUpdate: () => void;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    navigator.serviceWorker.ready.then((registration) => {
      // Check for waiting worker on load
      if (registration.waiting) {
        setUpdateAvailable(true);
      }

      // Listen for new worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Reload on controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const applyUpdate = useCallback(() => {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }, []);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    updateAvailable: updateAvailable && !dismissed,
    applyUpdate,
    dismissUpdate,
  };
}
