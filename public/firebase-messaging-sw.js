importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC-PxivjoAqQr08vhPamjspoCy8ZqlEEsg",
    projectId: "expense-tracker-app-480d4",
    messagingSenderId: "1011963799400",
    appId: "1:1011963799400:web:b4a09244816208974658dd"
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...', event);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...', event);
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    console.log('[SW] Push event received:', event);
    if (event.data) {
        const data = event.data.json();
        console.log('[SW] Push data:', data);
        
        const options = {
            body: data.notification.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: data.data,
            requireInteraction: true,
            tag: data.data?.type || 'default',
            actions: data?.type === 'FRIEND_REQUEST' ? [
                { action: 'accept', title: 'Accept' },
                { action: 'decline', title: 'Decline' }
            ] : []
        };

        event.waitUntil(
            self.registration.showNotification(data.notification.title, options)
        );
    }
});

messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);
});

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked:', event);
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