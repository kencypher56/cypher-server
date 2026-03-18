// cypher-server — Service Worker
const CACHE_NAME = 'cypher-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/_static/styles.css',
  '/_static/background.js',
  '/_static/design.js',
  '/_static/download.js',
  '/_static/video_player.js',
  '/_static/audio_player.js',
  '/_static/pdf_viewer.js',
  '/_static/picture_viewer.js',
];

// ── Install: pre-cache static shell ────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch Strategy ──────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, streaming, or zip downloads
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/api/stream') ||
    url.pathname.startsWith('/api/download') ||
    url.pathname.startsWith('/api/zip')
  ) {
    return; // let the network handle it
  }

  // For static assets: Cache-First
  if (
    url.pathname.startsWith('/_static/') ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // CDN resources (Tailwind, Three.js, PDF.js, Lucide, fonts): Cache-First
  const isCDN = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ].some(host => url.hostname.includes(host));

  if (isCDN) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        }).catch(() => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Everything else: Network-First (browse API already excluded above)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Background sync placeholder ────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0] && event.ports[0].postMessage({ done: true });
    });
  }
});