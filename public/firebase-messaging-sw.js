importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC-PxivjoAqQr08vhPamjspoCy8ZqlEEsg",
    projectId: "expense-tracker-app-480d4",
    messagingSenderId: "1011963799400",
    appId: "1:1011963799400:web:b4a09244816208974658dd"
});

const messaging = firebase.messaging();

// Add installation and activation logging
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Add explicit push event handler
self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
    if (event.data) {
        const data = event.data.json();
        console.log('Push data:', data);
        
        const options = {
            body: data.notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: data.data,
            requireInteraction: true,
            actions: [
                {
                    action: 'accept',
                    title: 'Accept'
                },
                {
                    action: 'decline',
                    title: 'Decline'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.notification.title, options)
        );
    }
});

self.addEventListener('install', (event) => {
    console.log('[Production SW] Installing...', event);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Production SW] Activating...', event);
    event.waitUntil(clients.claim());
});

messaging.onBackgroundMessage((payload) => {
    console.log('[Production SW] Background message received:', payload);
    
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: payload.data,
        requireInteraction: true,
        tag: payload.data?.type || 'default'
    };

    return self.registration.showNotification(
        payload.notification.title,
        notificationOptions
    ).then(() => {
        console.log('[Production SW] Notification shown successfully');
    }).catch((error) => {
        console.error('[Production SW] Error showing notification:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});