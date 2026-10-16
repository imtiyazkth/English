/* English Saathi service worker.
 * Strategy: runtime caching of same-origin GET requests so the app opens offline after the first
 * successful online visit. Hashed build files never change, so they are served cache-first; the HTML
 * shell is network-first (so updates arrive) with a cached fallback. /api/* is never cached. */
const VERSION = 'v1';
const CACHE = `english-saathi-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('english-saathi-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch third-party requests
  if (url.pathname.includes('/api/')) return; // tutor and health must always hit the network

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cached = (await caches.match(req)) || (await caches.match('./')) || (await caches.match('./index.html'));
          return cached || new Response('You are offline and this page has not been saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === 'basic') {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })(),
  );
});
