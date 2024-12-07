import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { userToken, type, data } = await req.json();
        
        if (!userToken) {
            return NextResponse.json(
                { error: 'FCM token is required' }, 
                { status: 400 }
            );
        }

        const accessToken = await admin.app().options.credential?.getAccessToken();
        
        if (!accessToken?.access_token) {
            return NextResponse.json(
                { error: 'Failed to get Firebase admin access token' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token: userToken,
                        notification: {
                            title: data.title,
                            body: data.body
                        },
                        data: {
                            type: type,
                            url: data.url || '/',
                            ...data
                        },
                        webpush: {
                            fcm_options: { 
                                link: data.url || '/' 
                            }
                        }
                    }
                })
            }
        );

        const result = await response.json();
        
        if (!response.ok) {
            console.error('FCM API error:', result);
            return NextResponse.json(result, { status: response.status });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Notification send error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        }, { status: 500 });
    }
}