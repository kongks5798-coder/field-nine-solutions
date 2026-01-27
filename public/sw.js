/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: NEXUS-X PWA SERVICE WORKER v4
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enhanced offline support with blockchain API caching
 * - Smart caching strategies
 * - Blockchain data caching
 * - Push notifications with actions
 * - Background sync for transactions
 * - IndexedDB for offline data persistence
 */

const CACHE_NAME = 'nexus-empire-v5';
const CACHE_VERSION = '5.0.0';
const OFFLINE_URL = '/offline';

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 64 HOTFIX: FORCE FRESH CONTENT FOR LANDING PAGES
// ═══════════════════════════════════════════════════════════════════════════════
const ALWAYS_NETWORK_FIRST_ROUTES = [
  '/',
  '/ko',
  '/en',
  '/ja',
  '/zh',
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRECACHE ASSETS
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// API CACHE PATTERNS (Enhanced with Blockchain)
// ═══════════════════════════════════════════════════════════════════════════════

const API_CACHE_CONFIG = {
  // Short TTL (10s) - Highly dynamic data
  short: {
    ttl: 10 * 1000,
    patterns: [
      '/api/live/tesla',
      '/api/live/yeongdong',
      '/api/kaus/price',
      '/api/blockchain?action=gas',
    ],
  },
  // Medium TTL (60s) - Moderately dynamic
  medium: {
    ttl: 60 * 1000,
    patterns: [
      '/api/kaus/balance',
      '/api/blockchain?action=tvl',
      '/api/blockchain?action=status',
    ],
  },
  // Long TTL (5min) - Stable data
  long: {
    ttl: 5 * 60 * 1000,
    patterns: [
      '/api/blockchain?action=balance',
      '/api/blockchain?action=token',
      '/api/blockchain?action=tx',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

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
    '.gif',
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

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXEDDB CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DB_NAME = 'NexusOfflineDB';
const DB_VERSION = 2;
const STORES = {
  pendingTx: 'pending-transactions',
  cachedData: 'cached-data',
  userPrefs: 'user-preferences',
};

let db = null;

async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Pending transactions store
      if (!database.objectStoreNames.contains(STORES.pendingTx)) {
        const txStore = database.createObjectStore(STORES.pendingTx, { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('timestamp', 'timestamp', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      // Cached data store
      if (!database.objectStoreNames.contains(STORES.cachedData)) {
        const cacheStore = database.createObjectStore(STORES.cachedData, { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }

      // User preferences store
      if (!database.objectStoreNames.contains(STORES.userPrefs)) {
        database.createObjectStore(STORES.userPrefs, { keyPath: 'key' });
      }
    };
  });
}

async function getDB() {
  if (!db) {
    await initIndexedDB();
  }
  return db;
}

async function addToStore(storeName, data) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore(storeName) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearStore(storeName) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(storeName, key) {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log(`[SW v${CACHE_VERSION}] Installing...`);

  event.waitUntil(
    Promise.all([
      // Precache assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(
          PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' }))
        ).catch((err) => {
          console.log('[SW] Precache partial fail:', err);
          return Promise.resolve();
        });
      }),
      // Initialize IndexedDB
      initIndexedDB().catch((err) => {
        console.log('[SW] IndexedDB init failed:', err);
      }),
    ])
  );

  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log(`[SW v${CACHE_VERSION}] Activating...`);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && (name.startsWith('nexus-') || name.startsWith('k-universal-')))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH EVENT
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin (except allowed CDNs)
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

  // Special handling for blockchain API
  if (url.pathname.startsWith('/api/blockchain')) {
    event.respondWith(handleBlockchainAPI(request, url));
    return;
  }

  // Regular caching strategy
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

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKCHAIN API HANDLER (with smart TTL caching)
// ═══════════════════════════════════════════════════════════════════════════════

async function handleBlockchainAPI(request, url) {
  const cacheKey = url.pathname + url.search;
  const ttl = getBlockchainCacheTTL(cacheKey);

  try {
    // Try cache first if within TTL
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime && Date.now() - parseInt(cachedTime) < ttl) {
        console.log('[SW] Blockchain cache hit:', cacheKey);
        // Revalidate in background
        fetchAndCache(request, cache, ttl);
        return cachedResponse;
      }
    }

    // Fetch fresh data
    const response = await fetch(request);
    if (response.ok) {
      await cacheWithTimestamp(cache, request, response.clone(), ttl);
    }
    return response;

  } catch (error) {
    console.error('[SW] Blockchain API error:', error);

    // Return cached data even if stale
    const cache = await caches.open(CACHE_NAME);
    const staleResponse = await cache.match(request);
    if (staleResponse) {
      console.log('[SW] Returning stale blockchain data');
      return staleResponse;
    }

    // Return offline error response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - blockchain data unavailable',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function getBlockchainCacheTTL(cacheKey) {
  for (const [, config] of Object.entries(API_CACHE_CONFIG)) {
    for (const pattern of config.patterns) {
      if (cacheKey.includes(pattern.replace('/api', ''))) {
        return config.ttl;
      }
    }
  }
  return API_CACHE_CONFIG.medium.ttl; // Default 60s
}

async function cacheWithTimestamp(cache, request, response, ttl) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-time', Date.now().toString());
  headers.set('sw-ttl', ttl.toString());

  const cachedResponse = new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  await cache.put(request, cachedResponse);
}

async function fetchAndCache(request, cache, ttl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheWithTimestamp(cache, request, response.clone(), ttl);
    }
  } catch {
    // Silent fail - cached data already served
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

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
  const url = new URL(request.url);
  const isLandingPage = ALWAYS_NETWORK_FIRST_ROUTES.some(
    route => url.pathname === route || url.pathname === route + '/'
  );

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

    // PHASE 64 HOTFIX: Never show offline page for landing pages
    // Let the browser show its own error instead of white screen
    if (isLandingPage) {
      console.log('[SW] Landing page network failed, letting browser handle');
      return new Response('', { status: 503 });
    }

    // For other navigation requests, serve offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
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

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  let data = {
    title: 'NEXUS Empire',
    body: 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'nexus-default',
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
      type: data.type || 'general',
    },
    tag: data.tag || 'nexus-default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: getNotificationActions(data.type),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

function getNotificationActions(type) {
  switch (type) {
    case 'transaction':
      return [
        { action: 'view-tx', title: 'View Transaction' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'price-alert':
      return [
        { action: 'view-market', title: 'View Market' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'energy':
      return [
        { action: 'view-energy', title: 'Energy Dashboard' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  let targetUrl = event.notification.data?.url || '/ko/nexus/energy';

  // Handle action-specific URLs
  switch (event.action) {
    case 'view-tx':
      targetUrl = '/ko/nexus/exchange';
      break;
    case 'view-market':
      targetUrl = '/ko/nexus/market';
      break;
    case 'view-energy':
      targetUrl = '/ko/nexus/energy';
      break;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find existing NEXUS window
      for (const client of clientList) {
        if (client.url.includes('/nexus/') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC
// ═══════════════════════════════════════════════════════════════════════════════

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
    case 'sync-blockchain-data':
      event.waitUntil(syncBlockchainData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

async function syncKausTransactions() {
  console.log('[SW] Syncing KAUS transactions...');
  try {
    const pendingTxs = await getAllFromStore(STORES.pendingTx);
    const kausTxs = pendingTxs.filter(tx => tx.type === 'kaus');

    for (const tx of kausTxs) {
      const response = await fetch('/api/kaus/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });

      if (response.ok) {
        await deleteFromStore(STORES.pendingTx, tx.id);
        console.log('[SW] KAUS tx synced:', tx.id);
      }
    }
    console.log('[SW] KAUS sync complete');
  } catch (err) {
    console.error('[SW] KAUS sync failed:', err);
    throw err; // Retry sync
  }
}

async function syncEnergyPurchases() {
  console.log('[SW] Syncing energy purchases...');
  try {
    const pendingTxs = await getAllFromStore(STORES.pendingTx);
    const energyTxs = pendingTxs.filter(tx => tx.type === 'energy');

    for (const tx of energyTxs) {
      const response = await fetch('/api/energy/purchase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });

      if (response.ok) {
        await deleteFromStore(STORES.pendingTx, tx.id);
      }
    }
    console.log('[SW] Energy sync complete');
  } catch (err) {
    console.error('[SW] Energy sync failed:', err);
    throw err;
  }
}

async function syncMembershipData() {
  console.log('[SW] Syncing membership data...');
  return Promise.resolve();
}

async function syncBlockchainData() {
  console.log('[SW] Syncing blockchain data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const endpoints = [
      '/api/blockchain?action=tvl',
      '/api/blockchain?action=status',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cacheWithTimestamp(cache, new Request(endpoint), response, API_CACHE_CONFIG.medium.ttl);
        }
      } catch {
        console.log('[SW] Failed to sync:', endpoint);
      }
    }
    console.log('[SW] Blockchain sync complete');
  } catch (err) {
    console.error('[SW] Blockchain sync failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERIODIC SYNC (for live data)
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'update-live-data') {
    event.waitUntil(updateLiveData());
  } else if (event.tag === 'update-blockchain-data') {
    event.waitUntil(syncBlockchainData());
  }
});

async function updateLiveData() {
  console.log('[SW] Updating live data...');
  try {
    const cache = await caches.open(CACHE_NAME);
    const endpoints = [
      ...API_CACHE_CONFIG.short.patterns,
      ...API_CACHE_CONFIG.medium.patterns,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const ttl = getBlockchainCacheTTL(endpoint);
          await cacheWithTimestamp(cache, new Request(endpoint), response, ttl);
        }
      } catch {
        console.log('[SW] Failed to update:', endpoint);
      }
    }
  } catch (err) {
    console.error('[SW] Live data update failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER (for client communication)
// ═══════════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(payload.urls || []);
        })
      );
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          console.log('[SW] Cache cleared');
        })
      );
      break;

    case 'GET_CACHE_STATS':
      event.waitUntil(
        getCacheStats().then((stats) => {
          event.ports[0]?.postMessage({ type: 'CACHE_STATS', stats });
        })
      );
      break;

    case 'QUEUE_TRANSACTION':
      event.waitUntil(
        addToStore(STORES.pendingTx, {
          ...payload,
          timestamp: Date.now(),
        }).then((id) => {
          console.log('[SW] Transaction queued:', id);
          // Request background sync
          return self.registration.sync.register(`sync-${payload.type}-transaction`);
        })
      );
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function getCacheStats() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();

  let totalSize = 0;
  const entries = [];

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      totalSize += blob.size;
      entries.push({
        url: request.url,
        size: blob.size,
        cachedTime: response.headers.get('sw-cached-time'),
      });
    }
  }

  return {
    version: CACHE_VERSION,
    cacheName: CACHE_NAME,
    totalEntries: keys.length,
    totalSize,
    entries: entries.slice(0, 20), // Limit entries returned
  };
}

console.log(`[SW] NEXUS Empire Service Worker v${CACHE_VERSION} loaded`);
