import { NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { token, title, body, data } = await req.json();
        
        console.log('Preparing to send notification:', { token, title, body, data });

        const message = {
            token,
            notification: {
                title,
                body,
            },
            data: data ? 
                Object.entries(data).reduce((acc, [key, value]) => ({
                    ...acc,
                    [key]: String(value)
                }), {}) 
                : undefined,
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png',
                    requireInteraction: true,
                    actions: data?.type === 'FRIEND_REQUEST' ? [
                        { action: 'accept', title: 'Accept' },
                        { action: 'decline', title: 'Decline' }
                    ] : []
                },
                fcm_options: {
                    link: data?.url || '/'
                }
            }
        };

        console.log('Sending FCM message:', JSON.stringify(message, null, 2));

        const response = await admin.messaging().send(message);
        console.log('FCM Response:', response);
        
        return NextResponse.json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
            { success: false, error: String(error) }, 
            { status: 500 }
        );
    }
}