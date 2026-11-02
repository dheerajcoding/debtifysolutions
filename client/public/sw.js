// Debtify service worker. Personal pages and the API are network-only and never
// stored; only static assets are cached. "purge" wipes everything on sign-out.
const CACHE = "debtify-static-v1";
const NEVER_CACHE = ["/api/", "/dashboard", "/settings", "/apply", "/staff", "/dev/"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  if (NEVER_CACHE.some((p) => url.pathname.startsWith(p)) || event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }
  if (url.pathname.startsWith("/assets/") || /\.(png|svg|json|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then((c) => c.match(event.request).then((hit) => hit || fetch(event.request).then((res) => { if (res.ok) c.put(event.request, res.clone()); return res; })))
    );
  }
});

self.addEventListener("message", (e) => {
  if (e.data === "purge") caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
});
