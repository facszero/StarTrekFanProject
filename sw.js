// Star Trek: Final Frontier — Service Worker
// Caches all game assets for offline play and triggers PWA install prompt

const CACHE = 'stff-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/utils.js',
  './js/sprites.js',
  './js/background.js',
  './js/draw.js',
  './js/weapons.js',
  './js/entities.js',
  './js/hud.js',
  './js/game.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/sprites/enterprise_sheet.png',
  './assets/sprites/enterprise_angles.png',
  './assets/sprites/enemy_sheet.png',
  './assets/sprites/borg_sheet.png',
  './assets/sprites/romulan_sheet.png',
  './assets/sprites/klingon_sheet.png',
  './assets/sprites/hud_frame.png',
  './assets/sprites/logo.png',
  './assets/sprites/picard.png',
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for HTML
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
