// Clutch Service Worker — v11.06-S
// Push notifications ONLY — no caching to prevent stale JS chunks

const CACHE_VERSION = 'clutch-v11'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Purge all old caches on activation to prevent stale JS issues
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_VERSION) return caches.delete(key)
      }))
    ).then(() => clients.claim())
  )
})

// Network-first: never serve cached JS/HTML to avoid stale chunk bugs
self.addEventListener('fetch', e => {
  // Only handle same-origin requests, pass everything else through
  if (!e.request.url.startsWith(self.location.origin)) return
  // Never cache — always go to network
  e.respondWith(fetch(e.request).catch(() => Response.error()))
})

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return
  let payload = {}
  try { payload = e.data.json() } catch { payload = { title: 'Clutch', body: e.data.text() } }

  const { title = 'Clutch ☕', body = '', icon = '/icon-192.png', url = '/app', tag = 'clutch' } = payload

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      tag,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url }
    })
  )
})

// Clic sur notification → ouvre l'app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/app'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/app') && 'focus' in c) return c.focus()
      }
      return clients.openWindow(url)
    })
  )
})
