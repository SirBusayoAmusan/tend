/* Tend — minimal pass-through service worker.
   Its presence (with a fetch handler) makes the app installable as a PWA,
   so phones get a real home-screen icon + standalone window ("app-style"). */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response('You seem to be offline — reconnect to keep tending.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        })
    )
  )
})
