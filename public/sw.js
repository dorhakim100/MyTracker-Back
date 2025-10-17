const CACHE_NAME = 'mytracker-cache-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo.png',
  '/logo-square.png',
  '/logo-dark.png',
  '/offline.gif',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key)
          })
        )
      )
      .then(() => self.clients.claim())
  )
})

function isSameOrigin(request) {
  try {
    const url = new URL(request.url)
    return url.origin === self.location.origin
  } catch (_) {
    return false
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() =>
          caches
            .match('/offline.html')
            .then((res) => res || caches.match('/index.html'))
        )
    )
    return
  }

  // Same-origin static assets: cache-first
  if (
    isSameOrigin(request) &&
    ['style', 'script', 'image', 'font'].includes(request.destination)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            return response
          })
      )
    )
    return
  }

  // Fallback: stale-while-revalidate for same-origin GET
  if (isSameOrigin(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networked = fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            return response
          })
          .catch(() => cached)
        return cached || networked
      })
    )
  }
})
