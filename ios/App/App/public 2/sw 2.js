// Clutch Service Worker — cache désactivé, push notifications uniquement
const CACHE_VERSION = 'clutch-v18z30-nocache'

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
  )
})
self.addEventListener('fetch', e => {
  // Aucun cache — réseau direct
  if (!e.request.url.startsWith(self.location.origin)) return
  e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => Response.error()))
})
self.addEventListener('push', e => {
  if (!e.data) return
  let payload = {}
  try { payload = e.data.json() } catch { payload = { title: 'Clutch', body: e.data.text() } }
  const { title = 'Clutch ☕', body = '', icon = '/icon-192.png', url = '/app', tag = 'clutch' } = payload
  e.waitUntil(self.registration.showNotification(title, { body, icon, badge: '/icon-192.png', tag, renotify: true, vibrate: [200,100,200], data: { url } }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/app'
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    for (const c of list) { if (c.url.includes('/app') && 'focus' in c) return c.focus() }
    return clients.openWindow(url)
  }))
})
