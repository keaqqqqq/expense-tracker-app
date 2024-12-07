import { NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { FirebaseError } from 'firebase-admin';

export async function POST(req: Request) {
    try {
        const { token, title, body, data } = await req.json();
        
        console.log('Production API - Notification request:', {
            token: token?.substring(0, 10) + '...',
            title,
            body,
            data
        });

        // Verify admin initialization
        if (!admin.apps.length) {
            console.error('Firebase admin not initialized');
            return NextResponse.json({ 
                success: false, 
                error: 'Firebase admin not initialized' 
            }, { status: 500 });
        }

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
                    tag: data?.type || 'default',
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

        console.log('Production API - Sending FCM message:', {
            messagePreview: JSON.stringify(message).substring(0, 200) + '...'
        });

        try {
            const response = await admin.messaging().send(message);
            console.log('Production API - FCM Success:', response);
            return NextResponse.json({ success: true, messageId: response });
        } catch (error) {
            const fcmError = error as FirebaseError;
            console.error('Production API - FCM Error:', {
                code: fcmError.code,
                message: fcmError.message,
                stack: fcmError.stack
            });
            return NextResponse.json({ 
                success: false, 
                error: fcmError.message,
                code: fcmError.code
            }, { status: 500 });
        }
    } catch (error) {
        const serverError = error as Error;
        console.error('Production API - Request Error:', {
            message: serverError.message,
            stack: serverError.stack
        });
        return NextResponse.json(
            { success: false, error: serverError.message }, 
            { status: 500 }
        );
    }
}