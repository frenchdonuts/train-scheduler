var staticCacheName = 'train-scheduler-static-v1'

const {
  assets,
} = serviceWorkerOption

let assetsToCache = [
  ...assets,
  './',
  './gtfs/stops.txt',
  './gtfs/stop_times.txt'
].map((path) => {
  return new URL(path, location).toString();
})


self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).
            then(cache =>
                cache.addAll(assetsToCache)
            )
    )
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('train-scheduler-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
    //
    event.respondWith(
        caches.match(event.request).
            then(cachedResponse => cachedResponse || fetch(event.request))
    )
})
