import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { initializeMessaging } from '@/firebase/config';
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

        const messaging = await initializeMessaging();
        if (!messaging) return null;

        // Register service worker with correct scope
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
        });
        await navigator.serviceWorker.ready;

        // First, try to delete any existing token
        try {
            await deleteToken(messaging);
        } catch (error) {
            console.log('No existing token to delete');
        }

        // Get a new token
        const token = await getToken(messaging, {
            serviceWorkerRegistration: registration,
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (!token) {
            console.error('Failed to get FCM token');
            return null;
        }
        console.log('FCM Token:', token.substring(0, 10) + '...');

        // Update token in database
        await updateDoc(doc(db, 'Users', userId), { 
            fcmToken: token,
            lastTokenRefresh: new Date().toISOString()
        });

        // Handle foreground messages
        onMessage(messaging, (payload) => {
            new Notification(payload.notification?.title || 'New Notification', {
                body: payload.notification?.body,
                icon: '/icons/icon-192x192.png',
                data: payload.data
            });
        });

        return token;
    } catch (error) {
        console.error('Notification setup failed:', error);
        return null;
    }
}

export async function refreshFCMToken(userId: string) {
    try {
        const messaging = await initializeMessaging();
        if (!messaging) return null;

        // Delete existing token
        try {
            await deleteToken(messaging);
        } catch (error) {
            console.log('No existing token to delete');
        }

        const registration = await navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope');
        if (!registration) return null;

        // Get new token
        const newToken = await getToken(messaging, {
            serviceWorkerRegistration: registration,
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (newToken) {
            await updateDoc(doc(db, 'Users', userId), { 
                fcmToken: newToken,
                lastTokenRefresh: new Date().toISOString()
            });
            console.log('Token manually refreshed:', newToken.substring(0, 10) + '...');
            return newToken;
        }
        return null;
    } catch (error) {
        console.error('Manual token refresh failed:', error);
        return null;
    }
}

// Function to check and refresh token if needed
export async function checkAndRefreshToken(userId: string): Promise<string | null> {
    try {
        const userDoc = await getDoc(doc(db, 'Users', userId));
        const currentToken = userDoc.data()?.fcmToken;
        
        if (!currentToken) {
            console.log('No token found, getting new token');
            return await refreshFCMToken(userId);
        }

        // Check if token needs refresh (e.g., every 7 days)
        const lastRefresh = userDoc.data()?.lastTokenRefresh;
        if (lastRefresh) {
            const lastRefreshDate = new Date(lastRefresh);
            const daysSinceRefresh = (new Date().getTime() - lastRefreshDate.getTime()) / (1000 * 3600 * 24);
            
            if (daysSinceRefresh > 7) {
                console.log('Token older than 7 days, refreshing');
                return await refreshFCMToken(userId);
            }
        }

        return currentToken;
    } catch (error) {
        console.error('Token check failed:', error);
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