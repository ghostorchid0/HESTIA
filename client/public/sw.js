const CACHE_NAME = 'hestia-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function offlineResponse() {
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Désactiver le service worker en dev pour éviter les conflits avec Vite HMR
  if (self.location.hostname === 'localhost') {
    return;
  }

  // Ne jamais intercepter les assets du Vite dev server
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/__vite') ||
    url.pathname.includes('/node_modules/.vite') ||
    url.search.includes('__vite') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.search.includes('import')
  ) {
    return;
  }

  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || offlineResponse())
        )
    );
    return;
  }

  // Pour les pages HTML (navigation), network-first pour éviter un index.html obsolète
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || offlineResponse())
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => offlineResponse());
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Hestia', body: 'New update' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { orderId } = event.notification.data || {};
  event.waitUntil(
    self.clients.openWindow(orderId ? `/room/${orderId}` : '/')
  );
});
