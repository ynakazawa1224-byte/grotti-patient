// === sw.js: 安定化パッチ ===
const CACHE_VER = 'gp-v7';
const STATIC_CACHE = `${CACHE_VER}-static`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC_CACHE).then((c)=>c.addAll([
    // ここに icon/png 等の静的ファイルを必要に応じて
    // '/grotti-patient/icon-192.png', '/grotti-patient/icon-512.png'
  ])));
});

self.addEventListener('activate', (e) => {
  clients.claim();
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(CACHE_VER)).map(k => caches.delete(k)))
    )
  );
});

// HTML(ナビゲーション)はネット優先、他はキャッシュ優先
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  // ?v= / ?boot= が付くURLは常にネット優先
  const forceNetwork = /[?&](v|boot)=/.test(new URL(req.url).search);

  if (isNav || forceNetwork) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }

  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(STATIC_CACHE).then(c => c.put(req, copy));
      return resp;
    }))
  );
});
