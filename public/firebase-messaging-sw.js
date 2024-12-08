importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC-PxivjoAqQr08vhPamjspoCy8ZqlEEsg",
    projectId: "expense-tracker-app-480d4",
    messagingSenderId: "1011963799400",
    appId: "1:1011963799400:web:b4a09244816208974658dd"
});

const messaging = firebase.messaging();

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    let urlToOpen = event.notification.data?.url || '/';
    
    if (event.action === 'accept') {
        urlToOpen = '/friends?action=accept';
    } else if (event.action === 'decline') {
        urlToOpen = '/friends?action=decline';
    }

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