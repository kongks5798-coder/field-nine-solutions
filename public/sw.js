/**
 * FieldNine Service Worker v1
 * - Static assets만 캐싱 (CSS, JS, 이미지)
 * - HTML 페이지는 항상 네트워크에서 새로 가져옴
 * - 배포 즉시 반영 보장
 */

const CACHE_NAME = 'fieldfine-v1';

// 설치 시 모든 구버전 캐시 삭제
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTML 페이지 → 항상 네트워크 우선 (캐싱 안 함)
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  // Next.js 정적 에셋 (_next/static) → 캐시 우선 (파일명에 해시 포함되므로 안전)
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
