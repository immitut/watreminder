const CACHE_NAME = 'sw_cache_2'

const cacheList = [
  '/watreminder/index.html',
  '/watreminder/index.js',
  '/watreminder/a2hs.js',
  '/watreminder/style.css',
  '/watreminder/manifest.json',
  '/watreminder/icon/favicon.ico',
  '/watreminder/icon/icon.png',
]

// 失效？
self.onnotificationclose = (e) => {
  console.log(e)
}

// notificationclick event
self.onnotificationclick = (e) => {
  e.waitUntil(
    (async () => {
      const [client] = await clients.matchAll({
        includeUncontrolled: true,
      })
      e.notification.close()
      client.postMessage(e.action)
    })()
  )
}

self.addEventListener('install', async () => {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(cacheList)
  self.skipWaiting()
})

self.addEventListener('activate', async () => {
  const cacheKeys = await caches.keys()
  cacheKeys.forEach((key) => {
    if (key !== CACHE_NAME) {
      caches.delete(key)
    }
  })
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async (request) => {
      try {
        const fresh = await fetch(request)
        console.log('[online]', request.url)
        return fresh
      } catch (err) {
        const cache = await caches.open(CACHE_NAME)
        const res = await cache.match(request)
        console.log('[cached]', request.url)
        return res
      }
    })(e.request)
  )
})
