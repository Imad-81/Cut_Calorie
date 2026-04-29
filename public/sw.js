const CACHE_NAME = "cut-pwa-cache-v1";
const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/C.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("Service worker: some assets failed to cache", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // Network First for API routes and Navigation (HTML)
  if (url.pathname.startsWith('/api/') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.error("Network First fetch failed:", err);
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response("Offline or Network Error", { status: 503, headers: { "Content-Type": "text/plain" } });
        });
      })
    );
    return;
  }

  // Cache First with Network Fallback for static assets and other resources
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).catch((err) => {
        console.error("Cache First fetch failed:", err);
        return new Response("Offline or Network Error", { status: 503, headers: { "Content-Type": "text/plain" } });
      });
    })
  );
});
