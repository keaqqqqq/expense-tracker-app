import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, app } from '@/firebase/config';
import { initializeMessaging } from "@/firebase/config";
export const NotificationTypes = {
    NEW_EXPENSE: 'NEW_EXPENSE',
    EXPENSE_SETTLED: 'EXPENSE_SETTLED',
    FRIEND_REQUEST: 'FRIEND_REQUEST',
    GROUP_INVITE: 'GROUP_INVITE'
} as const;

export type NotificationType = keyof typeof NotificationTypes;

export async function initializeNotifications(userId: string) {
    try {
        if (typeof window === 'undefined') return null;
        
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return null;
        }

        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        if (permission !== 'granted') return null;

        // First get the messaging instance
        const messaging = await initializeMessaging();
        if (!messaging) {
            console.error('Messaging not initialized');
            return null;
        }

        // Then register service worker
        let registration;
        try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;
            console.log('Service Worker registered:', registration.scope);
        } catch (swError) {
            console.error('Service Worker registration failed:', swError);
            return null;
        }

        // Get token with VAPID key
        try {
            console.log('VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 10) + '...');
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (!token) {
                console.error('No token received');
                return null;
            }

            console.log('FCM Token received:', token.substring(0, 10) + '...');

            await updateDoc(doc(db, 'Users', userId), {
                fcmToken: token,
                lastTokenUpdate: new Date().toISOString()
            });

            // Setup message handler
            onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                new Notification(payload.notification?.title || 'New Notification', {
                    body: payload.notification?.body,
                    icon: '/icons/icon-192x192.png',
                    data: payload.data
                });
            });

            return token;
        } catch (tokenError) {
            console.error('Token retrieval error:', tokenError);
            return null;
        }
    } catch (error) {
        console.error('Notification setup error:', error);
        return null;
    }
}

export async function getUserFCMToken(userId: string) {
    try {
        const userDoc = await getDoc(doc(db, 'Users', userId));
        return userDoc.data()?.fcmToken;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

export async function sendNotification(userToken: string, type: NotificationType, data: any) {
    try {
        // Get the base URL with proper type checking
        const baseUrl = typeof window !== 'undefined' 
            ? window.location.port === '3001'
                ? 'http://localhost:3001'
                : window.location.origin
            : process.env.NEXT_PUBLIC_VERCEL_URL 
                ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
                : 'http://localhost:3000';

        console.log('Using base URL:', baseUrl);

        const response = await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: userToken,
                title: data.title,
                body: data.body,
                data: {
                    ...data,
                    type
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send notification');
        }

        return response.json();
    } catch (error) {
        console.error('Send notification error:', error);
        throw error;
    }
}