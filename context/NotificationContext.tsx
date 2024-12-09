'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { initializeNotifications } from '@/lib/actions/notifications';

interface NotificationContextType {
    token: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
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

    // Modify in NotificationProvider
    useEffect(() => {
        if (userId && 'Notification' in window) {
            const initNotifs = async () => {
                try {
                    const token = await initializeNotifications(userId);
                    console.log('Notification setup result:', !!token);
                    setToken(token);
                } catch (err) {
                    console.error('Notification setup failed:', err);
                }
            };
            initNotifs();
        }
    }, [userId]);

    return (
        <NotificationContext.Provider value={{ token }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);