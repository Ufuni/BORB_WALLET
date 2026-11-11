// UQ BORB Wallet — service worker minimal.
// Stratégie : network-first pour l'API, cache-first pour le shell.
const CACHE = 'uq-borb-wallet-v1';
const SHELL = ['/wallet', '/manifest.webmanifest', '/wallet-icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // API : toujours réseau (les soldes ne se mettent jamais en cache)
  if (url.pathname.startsWith('/tx') || url.pathname.startsWith('/ordres') ||
      url.pathname.startsWith('/compte') || url.pathname.startsWith('/solde') ||
      url.pathname.startsWith('/taux') || url.pathname.startsWith('/sante') ||
      url.pathname.startsWith('/pays') || url.pathname.startsWith('/ordre') ||
      url.pathname.startsWith('/bande')) {
    return; // pas d'interception → réseau direct
  }
  // Shell : cache d'abord, réseau en secours
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copie = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copie));
      return r;
    }))
  );
});
