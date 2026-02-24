/**
 * Dalkak Service Worker v4
 * - 정적 파일 프리캐시 (offline.html, manifest, 아이콘)
 * - HTML: 네트워크 우선 → 캐시 폴백 → /offline.html
 * - 정적 에셋(_next/static): 캐시 우선 (파일명 해시)
 * - API: 네트워크 전용 (캐시 안 함)
 * - 기타: 네트워크 우선 → 캐시 폴백
 * - 구버전 캐시 발견 시 모든 탭 자동 새로고침
 */

const CACHE_NAME = 'dalkak-v4';

/** 설치 시 프리캐시할 정적 파일 목록 */
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        // 일부 파일 실패해도 설치는 진행
        console.warn('[SW] precache 일부 실패:', err);
        return cache.add('/offline.html');
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      // 현재 버전이 아닌 구버전 캐시 목록
      const oldCaches = names.filter((n) => n !== CACHE_NAME);
      const hadOldCaches = oldCaches.length > 0;
      return Promise.all(oldCaches.map((n) => caches.delete(n))).then(() => hadOldCaches);
    }).then((hadOldCaches) =>
      self.clients.claim().then(() => hadOldCaches)
    ).then((hadOldCaches) => {
      if (!hadOldCaches) return; // 신규 설치 → 리로드 불필요
      // 구버전에서 업그레이드 → 모든 탭 강제 새로고침
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 오리진만 캐시 (외부 리소스는 무시)
  if (url.origin !== self.location.origin) return;

  // API 요청 → 네트워크 전용 (캐싱 안 함)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML 페이지 (navigate) → 네트워크 우선, 실패 시 캐시, 최후 offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공 시 캐시 업데이트 (동적 페이지도 오프라인 대비)
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Next.js 정적 에셋 (_next/static) → 캐시 우선 (파일명 해시로 안전)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 정적 파일 (이미지, 폰트 등) → 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
