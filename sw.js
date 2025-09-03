// Service Worker for Fofr Pedro 3D
// This file pre-caches key assets (JS libraries, fonts, models and audio)
// and implements a cache-first strategy for fetch requests.

const CACHE_NAME = 'fofr-pedro-cache-v1';

// List of resources to pre-cache. Only include files that actually exist in the
// project directory. Pre-caching external resources such as CDN-hosted
// libraries, fonts or audio will fail when offline, so those entries are
// removed. If you add new local assets (e.g. icons or models), add them
// here so they can be served from the cache.
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'sw.js',
  'three.module.js',
  'GLTFLoader.js'
  , 'icon-192.png'
  , 'icon-512.png'
  // Note: Local 3D models and icons can be listed here if you place them in
  // the project directory. For now, the game relies on fallback meshes.
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