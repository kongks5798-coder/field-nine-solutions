/**
 * Field Nine - Service Worker
 * Tesla-style PWA with offline support and background sync
 */

const CACHE_NAME = 'field-nine-v1.0.0';
const RUNTIME_CACHE = 'field-nine-runtime';
const STATIC_CACHE = 'field-nine-static';

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 네트워크 우선, 캐시 폴백 전략 사용할 경로
const NETWORK_FIRST_PATTERNS = [
  /^\/api\//,
  /^\/dashboard/,
];

// 캐시 우선 전략 사용할 경로
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
  /\.(?:js|css)$/,
];

// 설치 이벤트: 정적 리소스 캐시
self.addEventListener('install', function(event) {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      // 즉시 활성화 (기존 SW 대기 없이)
      return self.skipWaiting();
    })
  );
});

// 활성화 이벤트: 오래된 캐시 삭제
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== STATIC_CACHE && name !== RUNTIME_CACHE;
          })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      // 모든 클라이언트에 즉시 제어권 부여
      return self.clients.claim();
    })
  );
});

// fetch 이벤트: 네트워크 요청 가로채기
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // 같은 출처 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }

  // API 요청: 네트워크 우선
  if (NETWORK_FIRST_PATTERNS.some(function(pattern) { return pattern.test(url.pathname); })) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 정적 리소스: 캐시 우선
  if (CACHE_FIRST_PATTERNS.some(function(pattern) { return pattern.test(url.pathname); })) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 기본: 네트워크 우선, 캐시 폴백
  event.respondWith(networkFirst(request));
});

// 네트워크 우선 전략
function networkFirst(request) {
  return fetch(request).then(function(networkResponse) {
    // 성공한 응답은 캐시에 저장
    if (networkResponse.ok) {
      var responseClone = networkResponse.clone();
      caches.open(RUNTIME_CACHE).then(function(cache) {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  }).catch(function(error) {
    // 네트워크 실패 시 캐시에서 찾기
    return caches.match(request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 오프라인 페이지 반환
      if (request.mode === 'navigate') {
        return new Response(
          '<!DOCTYPE html><html><head><title>오프라인 - Field Nine</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0A0A0A;color:#F5F5F0;text-align:center;padding:20px}h1{font-size:2rem;margin-bottom:1rem}p{color:#9CA3AF}</style></head><body><div><h1>오프라인 모드</h1><p>인터넷 연결을 확인해주세요.</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      
      throw error;
    });
  });
}

// 캐시 우선 전략
function cacheFirst(request) {
  return caches.match(request).then(function(cachedResponse) {
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return fetch(request).then(function(networkResponse) {
      if (networkResponse.ok) {
        var responseClone = networkResponse.clone();
        caches.open(RUNTIME_CACHE).then(function(cache) {
          cache.put(request, responseClone);
        });
      }
      return networkResponse;
    });
  });
}

// 메시지 이벤트: 클라이언트와 통신
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(function(cache) {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
