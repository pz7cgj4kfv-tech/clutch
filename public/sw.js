// Clutch Service Worker — v06.06-AD
// Push notifications + offline cache basique

const CACHE = 'clutch-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
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
