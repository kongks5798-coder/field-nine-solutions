/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 70: NEXUS-X PWA SERVICE WORKER v3
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enhanced offline support for Nexus Empire Dashboard
 * - Nexus route caching
 * - API data caching
 * - Push notifications
 * - Background sync for transactions
 */

const CACHE_NAME = 'nexus-empire-v3';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/ko',
  '/en',
  '/offline',
  // Nexus Core Routes
  '/ko/nexus/energy',
  '/ko/nexus/exchange',
  '/ko/nexus/market',
  '/ko/nexus/profile',
  '/ko/nexus/membership',
  '/en/nexus/energy',
  '/en/nexus/exchange',
  '/en/nexus/market',
  '/en/nexus/profile',
  '/en/nexus/membership',
  // Legacy Dashboard Routes
  '/ko/dashboard',
  '/ko/wallet',
  // Assets
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/live/tesla',
  '/api/live/yeongdong',
  '/api/kaus/balance',
  '/api/kaus/price',
];

// Cache strategies based on URL patterns
const CACHE_STRATEGIES = {
  cacheFirst: [
    '/_next/static/',
    '/icons/',
    '/images/',
    '.png',
    '.jpg',
    '.svg',
    '.woff2',
    '.webp',
    '.ico',
  ],
  networkFirst: [
    '/api/',
    '/ko/',
    '/en/',
    '/ja/',
    '/zh/',
    '/nexus/',
  ],
  staleWhileRevalidate: [
    '/_next/data/',
    '/health-status.json',
  ],
};

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Nexus Empire v3...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching Nexus assets');
      return cache.addAll(
        PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))
      ).catch((err) => {
        console.log('[SW] Precache partial fail:', err);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );

  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Nexus Empire v3...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('nexus-') || name.startsWith('k-universal-'))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin (except CDNs and fonts)
  if (url.origin !== self.location.origin) {
    const allowedOrigins = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdnjs.cloudflare.com',
      'cdn.jsdelivr.net',
    ];
    if (!allowedOrigins.some(origin => url.hostname.includes(origin))) {
      return;
    }
  }

  const strategy = getCacheStrategy(url.pathname);

  if (strategy === 'cacheFirst') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'networkFirst') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'staleWhileRevalidate') {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

function getCacheStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of patterns) {
      if (pathname.includes(pattern)) {
        return strategy;
      }
    }
  }
  return 'networkFirst';
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation requests, try to serve offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;

      // Fallback to ko page
      const koPage = await caches.match('/ko');
      if (koPage) return koPage;
    }

    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Push notification - Enhanced for Nexus
self.addEventListener('push', (event) => {
  let data = {
    title: 'NEXUS Empire',
    body: 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100, 50, 100],
    data: {
      url: data.url || '/ko/nexus/energy',
      timestamp: Date.now(),
    },
    tag: data.tag || 'nexus-default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click - Navigate to Nexus
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/ko/nexus/energy';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find existing window
      for (const client of clientList) {
        if (client.url.includes('/nexus/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Background sync for transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  switch (event.tag) {
    case 'sync-kaus-transaction':
      event.waitUntil(syncKausTransactions());
      break;
    case 'sync-energy-purchase':
      event.waitUntil(syncEnergyPurchases());
      break;
    case 'sync-membership':
      event.waitUntil(syncMembershipData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

async function syncKausTransactions() {
  console.log('[SW] Syncing KAUS transactions...');
  try {
    const pendingTxs = await getFromIndexedDB('pending-kaus-tx');
    for (const tx of pendingTxs) {
      await fetch('/api/kaus/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
    }
    await clearFromIndexedDB('pending-kaus-tx');
    console.log('[SW] KAUS sync complete');
  } catch (err) {
    console.error('[SW] KAUS sync failed:', err);
  }
}

async function syncEnergyPurchases() {
  console.log('[SW] Syncing energy purchases...');
  return Promise.resolve();
}

async function syncMembershipData() {
  console.log('[SW] Syncing membership data...');
  return Promise.resolve();
}

// IndexedDB helpers for offline data
async function getFromIndexedDB(storeName) {
  return [];
}

async function clearFromIndexedDB(storeName) {
  return Promise.resolve();
}

// Periodic sync for live data (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-live-data') {
    event.waitUntil(updateLiveData());
  }
});

async function updateLiveData() {
  console.log('[SW] Updating live data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const endpoint of API_CACHE_PATTERNS) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response);
        }
      } catch {
        console.log('[SW] Failed to update:', endpoint);
      }
    }
  } catch (err) {
    console.error('[SW] Live data update failed:', err);
  }
}

console.log('[SW] Nexus Empire Service Worker v3 loaded');
