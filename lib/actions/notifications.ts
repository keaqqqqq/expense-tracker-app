import { getToken, onMessage } from 'firebase/messaging';
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

// Updated sendNotification function to use FCM v1 API
export async function sendNotification(
    userToken: string, 
    type: NotificationType, 
    data: NotificationData
) {
    try {
        const notificationData = getNotificationTemplate(type, data);
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getAccessToken()}`
                },
                body: JSON.stringify({
                    message: {
                        token: userToken,
                        notification: {
                            title: notificationData.title,
                            body: notificationData.body
                        },
                        webpush: {
                            notification: {
                                icon: '/icons/icon-192x192.png',
                                click_action: notificationData.url || '/'
                            },
                            fcm_options: {
                                link: notificationData.url || '/'
                            }
                        },
                        data: sanitizeData(data)
                    }
                })
            }
        );

        return response.json();
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}

// Update the sanitizeData function to accept NotificationData
export function sanitizeData(data: NotificationData): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            sanitized[key] = String(value);
        }
    }
    return sanitized;
}

// Helper function to get access token
export async function getAccessToken(): Promise<string> {
    const response = await fetch('/api/fcm-token', {
        method: 'POST'
    });
    const data = await response.json();
    return data.token;
}

export async function initializeNotifications(userId: string) {
    try {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return null;
        }

        const messaging = await initializeMessaging();
        if (!messaging) return null;

        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        console.log('FCM token generated:', token); // Add this

        if (token) {
            // Save token to user's document
            await updateDoc(doc(db, 'Users', userId), {
                fcmToken: token
            });
            console.log('FCM token saved to user doc'); // Add this

            // Handle foreground messages
            onMessage(messaging, (payload) => {
                new Notification(payload.notification?.title || 'New Notification', {
                    body: payload.notification?.body,
                    icon: '/icons/icon-192x192.png',
                    data: payload.data
                });
            });

            return token;
        }

        return null;
    } catch (error) {
        console.error('Error initializing notifications:', error);
        return null;
    }
}

// Helper function to get user's FCM token
export async function getUserFCMToken(userId: string) {
    try {
        const userDoc = await getDoc(doc(db, 'Users', userId));
        return userDoc.data()?.fcmToken;
    } catch (error) {
        console.error('Error getting user FCM token:', error);
        return null;
    }
}