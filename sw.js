const CACHE_NAME = 'egu-vocab-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/index.css',
  '/css/dashboard.css',
  '/css/learn.css',
  '/css/test.css',
  '/css/review.css',
  '/js/data.js',
  '/js/storage.js',
  '/js/audio.js',
  '/js/animations.js',
  '/js/dashboard.js',
  '/js/learn.js',
  '/js/test.js',
  '/js/review.js',
  '/js/app.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
