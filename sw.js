const CACHEVERSION = 'sw-version-1'

const cacheList = [
  // '/watreminder/',
  '/watreminder/index.html',
  '/watreminder/index.js',
  '/watreminder/a2hs.js',
  '/watreminder/style.css',
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

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHEVERSION)
      .then((cache) => {
        return cache.addAll(cacheList)
      })
      .catch((err) => {
        console.log(err)
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      const { url } = e.request
      if (response) {
        // console.log('cached: ', url)
        return response
      }
      // console.log('fetching: ', url)
      return fetch(e.request).catch((err) => {
        console.log(`fetch ${url} error: `, err)
      })
    })
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((res) => {
        return res.reduce((data, curr) => {
          if (curr === CACHEVERSION) {
            data.push(curr)
          } else {
            caches.delete(curr)
          }
          return data
        }, [])
      })
      .then((res) => {
        return self.clients.claim()
      })
  )
})
