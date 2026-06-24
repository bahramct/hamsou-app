/* همسو — Service Worker حداقلی و محافظه‌کار (DECISION-121)
   هدف: نصب‌پذیریِ PWA (Android نیازمندِ fetch handler است) + fallbackِ آفلاین.
   اصلِ ایمنی: ناوبری‌ها network-first‌اند → هرگز صفحهٔ کهنه/خراب سرو نمی‌شود.
   فقط داراییِ استاتیکِ build (هش‌دار، immutable) cache می‌شود. */
const VERSION = "hamsoo-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.add(OFFLINE_URL)).catch(() => {}));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ناوبریِ صفحات: network-first + fallbackِ آفلاین (هرگز کهنه)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // داراییِ استاتیکِ هش‌دارِ build + فونت/آیکون: cache-first (immutable)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/Fonts/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});
