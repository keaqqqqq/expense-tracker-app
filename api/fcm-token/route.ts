// app/api/fcm-token/route.ts
import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST() {
    try {
        console.log('Starting token generation');
        const auth = new GoogleAuth({
            credentials: {
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        
        if (!accessToken.token) {
            throw new Error('No token received from Google Auth');
        }

        console.log('Token generated successfully');
        return NextResponse.json({ token: accessToken.token });
    } catch (error) {
        console.error('Token generation error:', error);
    }
}