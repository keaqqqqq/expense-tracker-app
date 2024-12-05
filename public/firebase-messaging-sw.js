// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Use const instead of process.env since service worker can't access process.env
const firebaseConfig = {
    apiKey: "AIzaSyC-PxivjoAqQr08vhPamjspoCy8ZqlEEsg",
    authDomain: "expense-tracker-app-480d4.firebaseapp.com",
    projectId: "expense-tracker-app-480d4",
    storageBucket: "expense-tracker-app-480d4.appspot.com",
    messagingSenderId: "1011963799400",
    appId: "1:1011963799400:web:b4a09244816208974658dd"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

const notificationActions = {
    NEW_EXPENSE: [
        { action: 'view', title: 'View Details' },
        { action: 'settle', title: 'Settle Now' }
    ],
    FRIEND_REQUEST: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' }
    ],
    GROUP_INVITE: [
        { action: 'join', title: 'Join Group' },
        { action: 'view', title: 'View Details' }
    ]
};

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationType = payload.data?.type || 'DEFAULT';
    
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: payload.data,
        tag: notificationType,
        actions: notificationActions[notificationType] || []
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    let urlToOpen = '/';

    // Handle different action clicks
    if (event.action) {
        const data = event.notification.data;
        
        switch (event.action) {
            case 'view':
                if (data.expenseId) {
                    urlToOpen = `/expenses/${data.expenseId}`;
                } else if (data.groupId) {
                    urlToOpen = `/groups/${data.groupId}`;
                }
                break;
            case 'settle':
                urlToOpen = `/expenses/${data.expenseId}/settle`;
                break;
            case 'accept':
                if (data.type === 'FRIEND_REQUEST') {
                    urlToOpen = `/friends/requests/${data.requesterId}`;
                }
                break;
            case 'join':
                if (data.groupId) {
                    urlToOpen = `/groups/${data.groupId}/join`;
                }
                break;
        }
    } else {
        // If no specific action, use the URL from notification data
        urlToOpen = event.notification.data?.url || '/';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});