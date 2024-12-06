// app/api/fcm-token/route.ts
import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST() {
    try {
        console.log('Starting FCM token generation');
        
        if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            console.error('Missing credentials:', {
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
            });
            throw new Error('Missing Firebase credentials');
        }

        const auth = new GoogleAuth({
            credentials: {
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        
        console.log('Access token generated:', !!accessToken.token);

        return NextResponse.json({ token: accessToken.token });
    } catch (error) {
        console.error('Detailed FCM token error:', error);
    }
}