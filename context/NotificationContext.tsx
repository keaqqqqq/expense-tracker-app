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
        if (userId) {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    initializeNotifications(userId).then(token => {
                        if (token) setToken(token);
                    });
                }
            });
        }
    }, [userId]);

    return (
        <NotificationContext.Provider value={{ token, notificationPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);