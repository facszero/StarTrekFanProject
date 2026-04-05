const CACHE = 'stff-v5';

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
  './js/story.js',
  './js/game.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/StarTrekTNG.ttf',
  './assets/sprites/enterprise_sheet.png',
  './assets/sprites/enterprise_angles.png',
  './assets/sprites/enemy_sheet.png',
  './assets/sprites/borg_sheet.png',
  './assets/sprites/romulan_sheet.png',
  './assets/sprites/klingon_sheet.png',
  './assets/sprites/cardassian_sheet.png',
  './assets/sprites/dominion_sheet.png',
  './assets/sprites/gorn_sheet.png',
  './assets/sprites/sp8472_sheet.png',
  './assets/sprites/ferengi_sheet.png',
  './assets/sprites/hirogen2_sheet.png',
  './assets/sprites/ds9_sheet.png',
  './assets/sprites/asteroid_sheet.png',
  './assets/sprites/unicomplex_sheet.png',
  './assets/bg/bg_act1.jpg',
  './assets/bg/bg_act2.jpg',
  './assets/bg/bg_act3.jpg',
  './assets/bg/bg_act4.jpg',
  './assets/sprites/earth_sheet.png',
  './assets/sprites/k7_sheet.png',
  './assets/sprites/spacedock_sheet.png',
  './assets/sprites/hud_frame.png',
  './assets/sprites/logo.png',
  './assets/sprites/picard.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

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
