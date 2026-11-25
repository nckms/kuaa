/* global self, caches */
// Service worker do Kuaa. Regras:
// - /api/* NUNCA passa por aqui (dados do aluno, sessão e pagamentos ficam só na rede).
// - Navegação: rede primeiro; sem rede, a última versão do app ou a página offline.
// - /assets/* (arquivos com hash do Vite): cache primeiro, são imutáveis.
const VERSION = 'kuaa-v2'
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/brand/wordmark-t.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(VERSION).then((cache) => cache.put('/', copy))
      }
      return response
    }).catch(async () => (await caches.match('/')) || (await caches.match('/offline.html'))))
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(VERSION).then((cache) => cache.put(request, copy))
      }
      return response
    })))
  }
})

// Lembretes de estudo (Web Push). O conteúdo vem da API do Kuaa.
self.addEventListener('push', (event) => {
  let data = { title: 'Kuaa', body: 'Hora de estudar um pouco?', url: '/dashboard', tag: 'kuaa' }
  try { data = { ...data, ...event.data.json() } } catch { /* usa o texto padrão */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, tag: data.tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    data: { url: data.url },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/dashboard', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
    if (open) return open.navigate(target.href).then((w) => (w || open).focus())
    return self.clients.openWindow(target.href)
  }))
})
