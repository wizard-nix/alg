const CACHE_NAME = 'algebra-trainer-v1';

// Все локальные ресурсы, которые кэшируем при установке
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Внешние CDN-ресурсы (KaTeX, шрифты) — кэшируем по мере обращения
const CDN_ORIGINS = [
  'https://cdn.jsdelivr.net',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Yandex Metrika и другие трекеры — всегда пропускаем в сеть без кэша
  if (url.hostname.includes('mc.yandex') || url.hostname.includes('yandex')) {
    return; // браузер обработает самостоятельно
  }

  // CDN: stale-while-revalidate (сначала кэш, потом обновляем в фоне)
  if (CDN_ORIGINS.some((origin) => request.url.startsWith(origin))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Локальные ресурсы: cache-first (кэш → сеть → fallback)
  event.respondWith(cacheFirst(request));
});

// ─── Стратегии ─────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Если это навигация — вернём стартовую страницу из кэша
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    return new Response('Нет соединения', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cached || fetchPromise;
}

