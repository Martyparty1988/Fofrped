// Service Worker for Fofr Pedro 3D
// This file pre-caches key assets (JS libraries, fonts, models and audio)
// and implements a cache-first strategy for fetch requests.

const CACHE_NAME = 'fofr-pedro-cache-v1';

// List of resources to pre-cache.  This includes the root page, the main
// HTML file, local models, icons, external libraries and audio assets.
const urlsToCache = [
  '/',
  'index.html',
  // Local 3D models
  'kenney3d_char_pedro.glb',
  'kenney3d_char_police.glb',
  'kenney3d_prop_car01.glb',
  'kenney3d_prop_car02.glb',
  'kenney3d_prop_scooter.glb',
  // Icons
  'icon-192.png',
  'icon-512.png',
  // External three.js library and loader
  'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js',
  // Fonts used by the game
  'https://fonts.gstatic.com/s/orbitron/v25/yMJRMIlzdpvBhQQL_Qq7dy0.woff2',
  'https://fonts.gstatic.com/s/sharetechmono/v15/Jwc5WYQjV4_es_AkdtFHmmAta04.woff2',
  // Audio assets
  'https://cdn.jsdelivr.net/gh/bwhmather/Juhani-Junkala-Retro-Game-Music-Pack@main/OGG/Level%203.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/laser1.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/swoosh.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/powerup1.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/powerup2.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/powerup3.ogg',
  'https://cdn.jsdelivr.net/gh/K-2da/Kenney-Sound-Effects-/digital/explosion1.ogg'
];

// During the install phase, cache all of the resources listed above.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// During activation, remove any old caches that don't match the current cache name.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests.  Serve from cache first, falling back to the network
// and then caching the response for future requests.  Only cache GET requests.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request).then(networkResponse => {
        // Cache valid responses for future use
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // If the network request fails and we have no cached response, just return undefined
        return cachedResponse;
      });
      // Return cached response if available, otherwise fall back to the network
      return cachedResponse || networkFetch;
    })
  );
});