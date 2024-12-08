import { NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { Message } from "firebase-admin/messaging";

export async function POST(req: Request) {
    try {
        const { token, title, body, data } = await req.json();
        console.log('Preparing to send notification:', { token, title, body, data });

        const message: Message = {
            token,
            notification: {
                title,
                body,
                imageUrl: data.image
            },
            data: {
                ...(data ? 
                    Object.entries(data).reduce((acc, [key, value]) => ({
                        ...acc,
                        [key]: String(value)
                    }), {}) 
                    : {}),
                foreground: 'true'
            },
            android: {
                priority: 'high' as const,
                notification: {
                    channelId: 'default',
                    visibility: 'public',
                    priority: 'max' 
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: data.image,
                    badge: '/icons/icon-72x72.png',
                    requireInteraction: true,
                    silent: false,
                    actions: data?.type === 'FRIEND_REQUEST' ? [
                        { action: 'accept', title: 'Accept' },
                        { action: 'decline', title: 'Decline' }
                    ] : [],
                    tag: data?.type || 'default'
                },
                fcmOptions: {
                    link: data?.url || '/'
                }
            },
            apns: {
                payload: {
                    aps: {
                        'content-available': 1,
                        'mutable-content': 1,
                        priority: 10
                    }
                },
                fcmOptions: {
                    imageUrl: data.image
                }
            }
        };

        const response = await admin.messaging().send(message);
        
        return NextResponse.json({ success: true, messageId: response });
    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
            { success: false, error: String(error) }, 
            { status: 500 }
        );
    }
}