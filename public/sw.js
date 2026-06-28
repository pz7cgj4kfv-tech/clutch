// Clutch Service Worker — PUSH UNIQUEMENT. Plus de handler 'fetch' (29.06).
// ⚠️ L'ancien handler faisait `fetch().catch(() => Response.error())` → le moindre fetch raté
//    (VPN, blip réseau, page neuve) devenait une ERREUR DURE « This page couldn't load » qui tuait
//    la navigation. On NE touche plus aux fetchs : le navigateur fait son réseau normalement (avec
//    ses propres retries). Le SW ne sert QUE les notifications push.
const CACHE_VERSION = 'clutch-v19-pushonly'

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
  )
})
// (pas de listener 'fetch' → réseau natif du navigateur, jamais d'erreur dure forcée)
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
