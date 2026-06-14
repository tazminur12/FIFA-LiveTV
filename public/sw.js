// ── StreamZone Service Worker ─────────────────────────────────────────────────
// Strategy:
//   • App shell (HTML, CSS, JS, fonts, icons) → Cache First
//   • HLS stream URLs (.m3u8, .ts)            → Network Only (always live)
//   • API / next data                         → Network First, fallback cache
//   • Everything else                         → Stale While Revalidate

const CACHE_VERSION = "streamzone-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/offline.html",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("streamzone-") && key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isHlsStream(url) {
  return url.includes(".m3u8") || url.includes(".ts") || url.includes("mpegts");
}

function isStaticAsset(url) {
  return (
    url.includes("/_next/static/") ||
    url.includes("/icons/") ||
    url.endsWith(".svg") ||
    url.endsWith(".png") ||
    url.endsWith(".jpg") ||
    url.endsWith(".woff2") ||
    url.endsWith(".woff") ||
    url.endsWith("/manifest.json")
  );
}

function isNextData(url) {
  return url.includes("/_next/data/") || url.includes("?_rsc=");
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET" || url.startsWith("chrome-extension://")) {
    return;
  }

  // 1️⃣ HLS streams → Network Only (never cache live video)
  if (isHlsStream(url)) {
    event.respondWith(fetch(request).catch(() => new Response("Stream unavailable", { status: 503 })));
    return;
  }

  // 2️⃣ Static assets (_next/static, icons, fonts) → Cache First
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3️⃣ Next.js data / RSC → Network First, fallback to cache
  if (isNextData(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4️⃣ HTML pages → Network First, fallback to cache, then offline page
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match("/offline.html");
        })
    );
    return;
  }

  // 5️⃣ Everything else → Stale While Revalidate
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached ?? networkFetch;
      })
    )
  );
});

// ── Push Notifications (future-ready) ────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "StreamZone", {
      body: data.body ?? "A new live event has started!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: "streamzone-notification",
      renotify: true,
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      const targetUrl = event.notification.data?.url ?? "/";
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
