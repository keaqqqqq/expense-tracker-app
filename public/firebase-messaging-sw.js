importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Minimal config needed for messaging
const firebaseConfig = {
    apiKey: "AIzaSyC-PxivjoAqQr08vhPamjspoCy8ZqlEEsg",
    projectId: "expense-tracker-app-480d4",
    messagingSenderId: "1011963799400",
    appId: "1:1011963799400:web:b4a09244816208974658dd"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Log installation
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting(); // Ensure new service worker activates immediately
});

// Log activation
self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

messaging.onBackgroundMessage(async (payload) => {
    console.log("Background message received:", payload);
    
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        data: payload.data,
        tag: payload.data?.type || 'default',
        requireInteraction: true
    };

    try {
        await self.registration.showNotification(
            payload.notification.title,
            notificationOptions
        );
        console.log('Notification shown successfully');
    } catch (error) {
        console.error('Error showing notification:', error);
    }
});