import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { initializeMessaging } from '@/firebase/config';
import admin from '@/lib/firebase-admin';
export const NotificationTypes = {
    NEW_EXPENSE: 'NEW_EXPENSE',
    EXPENSE_SETTLED: 'EXPENSE_SETTLED',
    FRIEND_REQUEST: 'FRIEND_REQUEST',
    GROUP_INVITE: 'GROUP_INVITE'
} as const;

export type NotificationType = keyof typeof NotificationTypes;

interface BaseNotificationData {
    url?: string;
}

interface ExpenseNotificationData extends BaseNotificationData {
    createdBy: string;
    amount: string;
    description: string;
    expenseId: string;
}

interface SettlementNotificationData extends BaseNotificationData {
    settledBy: string;
    amount: string;
    expenseId: string;
}

interface FriendRequestNotificationData extends BaseNotificationData {
    fromUser: string;
    requesterId: string;
}

interface GroupInviteNotificationData extends BaseNotificationData {
    fromUser: string;
    groupName: string;
    groupId: string;
}

type NotificationData = 
    | ExpenseNotificationData 
    | SettlementNotificationData 
    | FriendRequestNotificationData 
    | GroupInviteNotificationData;

interface NotificationTemplate {
    title: string;
    body: string;
    url?: string;
}

export function getNotificationTemplate(
    type: NotificationType, 
    data: NotificationData
): NotificationTemplate {
    switch (type) {
        case 'NEW_EXPENSE': {
            const expenseData = data as ExpenseNotificationData;
            return {
                title: 'New Expense Added',
                body: `${expenseData.createdBy} added expense: ${expenseData.amount} for ${expenseData.description}`,
                url: `/expenses/${expenseData.expenseId}`
            };
        }
        case 'EXPENSE_SETTLED': {
            const settlementData = data as SettlementNotificationData;
            return {
                title: 'Expense Settled',
                body: `${settlementData.settledBy} settled ${settlementData.amount}`,
                url: `/expenses/${settlementData.expenseId}`
            };
        }
        case 'FRIEND_REQUEST': {
            const friendData = data as FriendRequestNotificationData;
            return {
                title: 'New Friend Request',
                body: `${friendData.fromUser} sent you a friend request`,
                url: '/friends'
            };
        }
        case 'GROUP_INVITE': {
            const groupData = data as GroupInviteNotificationData;
            return {
                title: 'New Group Invitation',
                body: `${groupData.fromUser} invited you to group: ${groupData.groupName}`,
                url: `/groups/${groupData.groupId}`
            };
        }
        default: {
            // eslint-disable-next-line
            type _exhaustiveCheck = never;
            return {
                title: 'New Notification',
                body: 'You have a new notification',
                url: '/'
            };
        }
    }
}

export async function initializeNotifications(userId: string) {
    try {
        if (!('Notification' in window)) return null;
        
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        // Unregister existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));

        // Initialize messaging
        const messaging = await initializeMessaging();
        if (!messaging) return null;

        // Register service worker with correct scope
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
        });
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            serviceWorkerRegistration: registration,
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (token) {
            await updateDoc(doc(db, 'Users', userId), { fcmToken: token });
            onMessage(messaging, (payload) => {
                new Notification(payload.notification?.title || 'New Notification', {
                    body: payload.notification?.body,
                    icon: '/icons/icon-192x192.png',
                    data: payload.data
                });
            });
        }
        return token;
    } catch (error) {
        console.error('Notification setup failed:', error);
        return null;
    }
}

export async function sendNotification(userToken: string, type: NotificationType, data: NotificationData) {
    try {
        const notificationData = getNotificationTemplate(type, data);
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            body: JSON.stringify({ userToken, type, data: notificationData })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send notification');
        }
        return response.json();
    } catch (error) {
        console.error('Notification send error:', error);
        throw error;
    }
}

export function sanitizeData(data: NotificationData): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            sanitized[key] = String(value);
        }
    }
    return sanitized;
}


export async function getUserFCMToken(userId: string) {
    try {
        console.log('Getting FCM token for user:', userId);
        const userDoc = await getDoc(doc(db, 'Users', userId));
        const fcmToken = userDoc.data()?.fcmToken;
        console.log('FCM token found:', !!fcmToken);
        return fcmToken;
        } catch (error) {
        console.error('Error getting user FCM token:', error);
        return null;
    }
}