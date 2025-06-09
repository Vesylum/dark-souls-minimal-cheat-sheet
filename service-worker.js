const CACHE_NAME = 'dsmcs-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'css/bootstrap.min.css',
  'css/bootstrap-responsive.min.css',
  'css/main.css',
  'js/bootstrap.min.js',
  'js/jquery-3.7.1.min.js',
  'js/main.js',
  'data/playthrough.json',
  'data/checklists.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
