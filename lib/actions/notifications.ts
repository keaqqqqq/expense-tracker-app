import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, app } from '@/firebase/config';

export const NotificationTypes = {
    NEW_EXPENSE: 'NEW_EXPENSE',
    EXPENSE_SETTLED: 'EXPENSE_SETTLED',
    FRIEND_REQUEST: 'FRIEND_REQUEST',
    GROUP_INVITE: 'GROUP_INVITE'
} as const;

export type NotificationType = keyof typeof NotificationTypes;

export async function initializeNotifications(userId: string) {
    try {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return null;
        }

        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        
        if (permission !== 'granted') {
            console.log('Permission not granted');
            return null;
        }

        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (!token) {
            console.log('No token received');
            return null;
        }

        console.log('FCM Token:', token);

        // Save token to database
        await updateDoc(doc(db, 'Users', userId), { fcmToken: token });

        // Handle foreground messages
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            new Notification(payload.notification?.title || 'New Notification', {
                body: payload.notification?.body,
                icon: '/icons/icon-192x192.png',
                data: payload.data
            });
        });

        return token;
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
        const response = await fetch('/api/notifications/send', {
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
            throw new Error('Failed to send notification');
        }

        return response.json();
    } catch (error) {
        console.error('Send notification error:', error);
        throw error;
    }
}