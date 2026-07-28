// Minimal service worker — enables "Install app" / "Add to Home Screen"
// and lets the app shell open even with no internet connection.
// Deliberately does NOT intercept cross-origin requests (Firebase, Chart.js,
// SheetJS CDN, etc.) so those keep working exactly as before when online.

const CACHE_NAME = 'ewr-kpi-cache-v2';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // leave CDN/Firebase alone

  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
  );
});
