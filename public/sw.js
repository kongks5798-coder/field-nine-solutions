/**
 * Dalkak Service Worker v3
 * - 구버전 캐시 발견 시 모든 탭 자동 새로고침
 * - HTML은 항상 네트워크에서 가져옴 (캐싱 안 함)
 * - /_next/static/ 만 캐시 (파일명 해시로 안전)
 */

const CACHE_NAME = 'dalkak-v3';

self.addEventListener('install', (event) => {
  // offline.html 미리 캐싱
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/offline.html'))
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

  // HTML 페이지 → 네트워크 우선, 실패 시 offline.html 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
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

  // API 요청 → 캐싱 안 함
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 그 외 → 네트워크 우선
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
