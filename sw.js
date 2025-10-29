// sw.js
const CACHE = "grotti-patient-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => self.clients.claim());
self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET") return;
  e.respondWith(
    caches.match(request).then(res => res || fetch(request).catch(() => caches.match("./index.html")))
  );
});
