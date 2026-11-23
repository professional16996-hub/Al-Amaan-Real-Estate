/* Al Amaan Real Estate & Developers — Notification & PWA Service Worker */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle future Web Push payloads cleanly if configured
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {
    title: 'Al Amaan Real Estate & Developers',
    body: 'New property or project update available.',
    url: '/',
    tag: 'al-amaan-update',
  };
  try {
    const parsed = event.data.json();
    payload = { ...payload, ...parsed };
  } catch {
    payload.body = event.data.text() || payload.body;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag,
      vibrate: [150, 80, 150],
      data: { url: payload.url || '/' },
    })
  );
});

// Deep-link when user taps the notification in the mobile notification bar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
