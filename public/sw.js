// MSA University — Faculty of Biotechnology Service Worker
// Handles background web push notifications and offline asset caching

const CACHE_NAME = 'msa-biotech-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logos/faculty-of-biotechnology.jpeg',
  '/logos/msa-university.jpeg',
];

// Install: Cache core branding assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// Activate: Claim active clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Push Event: Wake up mobile phone and show banner on locked screen
self.addEventListener('push', (event) => {
  let data = {
    title: 'Faculty of Biotechnology Directive',
    body: 'You have a new academic update, deliverable submission, or deadline.',
    url: '/',
    icon: '/logos/faculty-of-biotechnology.jpeg',
    tag: 'faculty-alert',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/logos/faculty-of-biotechnology.jpeg',
    badge: '/logos/faculty-of-biotechnology.jpeg',
    data: {
      url: data.url || '/',
      taskId: data.taskId,
      timestamp: Date.now(),
    },
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || 'msa-biotech-alert',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open Deliverable' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click: Direct user to the specific task or overview
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
