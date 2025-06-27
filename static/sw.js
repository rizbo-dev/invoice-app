/**
 * Service Worker for InvoicePro SPA
 * Provides basic offline functionality and caching
 */

const CACHE_NAME = 'invoicepro-v1';
const STATIC_ASSETS = [
    '/spa-index.html',
    '/css/modern-professional.css',
    '/js/spa-router.js',
    '/js/spa-app.js',
    '/js/modern-interactions.js',
    '/js/views/dashboard-view.js',
    '/js/views/customers-view.js',
    '/js/views/products-view.js',
    '/js/views/invoice-detail-view.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests for now (could implement API caching here)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not successful
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the fetched resource
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If both cache and network fail, return offline page
                        if (event.request.destination === 'document') {
                            return caches.match('/spa-index.html');
                        }
                    });
            })
    );
});

// Background sync for future implementation
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        // Handle background sync here
        console.log('Background sync triggered');
    }
});

// Push notifications for future implementation
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/manifest.json',
            badge: '/manifest.json',
            vibrate: [100, 50, 100],
            data: data.data
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/spa-index.html')
    );
});