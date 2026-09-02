const CACHE_NAME = 'bdc-vault-v4.7.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './portal.html',
  './admin.html',
  './apply.html',
  './reset.html',
  './styles.css',
  './app.js',
  './pwa.js',
  './icon.svg',
  './manifest.json',
  './version.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Skip waiting message listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First for API, Cache First for Static Assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cache for external APIs & Google Apps Script
  if (url.origin.includes('google.com') || url.origin.includes('googleapis.com') || url.origin.includes('firebase')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
