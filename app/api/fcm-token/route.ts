// app/api/notifications/send/route.ts
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

// app/api/notifications/send/route.ts
export async function POST(req: Request) {
    try {
      const { userToken, type, data } = await req.json();
      const accessToken = await admin.app().options.credential?.getAccessToken();
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: userToken,
              notification: data,
              webpush: {
                fcm_options: { link: data.url || '/' }
              }
            }
          })
        }
      );
      return NextResponse.json(await response.json());
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, { status: 500 });
    }
   }