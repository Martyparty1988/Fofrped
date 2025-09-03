// Service Worker for Fofr Pedro 3D
const CACHE_NAME = 'fofr-pedro-cache-v1';

// List of resources to pre-cache
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    'sw.js',
    'three.module.js',
    'GLTFLoader.js',
    'game.js',
    'icon-192.png',
    'icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching app shell');
            return cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('Deleting cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Return cached version or fetch from network
            const networkFetch = fetch(event.request).then(networkResponse => {
                // Cache valid responses for future use
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If network fails and we have no cached response
                return cachedResponse;
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || networkFetch;
        })
    );
});
