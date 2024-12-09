import { getToken } from "firebase/messaging";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { initializeMessaging } from "@/firebase/config";
export const NotificationTypes = {
    NEW_EXPENSE: 'NEW_EXPENSE',
    EXPENSE_SETTLED: 'EXPENSE_SETTLED',
    FRIEND_REQUEST: 'FRIEND_REQUEST',
    GROUP_INVITE: 'GROUP_INVITE'
} as const;

interface NotificationData {
    title: string;
    body: string;
    image?: string;
    [key: string]: unknown; 
}

export type NotificationType = keyof typeof NotificationTypes | string;

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

        const messaging = await initializeMessaging();
        if (!messaging) {
            console.error('Messaging not initialized');
            return null;
        }

        let registration;
        try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;
            console.log('Service Worker registered:', registration.scope);
        } catch (swError) {
            console.error('Service Worker registration failed:', swError);
            return null;
        }

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

export async function sendNotification(userToken: string, type: NotificationType, data: NotificationData) {
    try {
        // const baseUrl = 'http://localhost:3000'
        const baseUrl = 'https://keaqqqqq.com';

                const requestBody = {
                    token: userToken,
                    title: data.title,
                    body: data.body,
                    data: {
                        ...data,
                        type, 
                        image: data.image
                    }
                };
        
        
                const response = await fetch(`${baseUrl}/api/notifications/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
        
                const result = await response.json();
        
        if (!response.ok) {
            console.error('Notification Send - API Error:', result);
            throw new Error(result.error || 'Failed to send notification');
        }

        console.log('Notification Send - Success:', result);
        return result;
    } catch (error) {
        console.error('Notification Send - Error:', error);
        throw error;
    }
}