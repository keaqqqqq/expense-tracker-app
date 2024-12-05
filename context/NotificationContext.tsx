'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { initializeNotifications } from '@/lib/actions/notifications';

interface NotificationContextType {
    notificationPermission: NotificationPermission;
    token: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
    notificationPermission: 'default',
    token: null
});

export function NotificationProvider({ 
    children,
    userId 
}: { 
    children: React.ReactNode;
    userId: string | undefined;
}) {
    const [token, setToken] = useState<string | null>(null);
    const [notificationPermission, setNotificationPermission] = 
        useState<NotificationPermission>('default');

        useEffect(() => {
            if (userId && 'serviceWorker' in navigator) {
                navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(async () => {
                        await navigator.serviceWorker.ready;
                        const permission = await Notification.requestPermission();
                        setNotificationPermission(permission);
                        if (permission === 'granted') {
                            const token = await initializeNotifications(userId);
                            if (token) setToken(token);
                        }
                    })
                    .catch(err => console.error('SW registration failed:', err));
            }
        }, [userId]);

    return (
        <NotificationContext.Provider value={{ token, notificationPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);