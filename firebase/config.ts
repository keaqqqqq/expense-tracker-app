import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth'
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
console.log('VAPID key starts with:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 5));
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app)
export const storage = getStorage(app);

let messagingInstance: Messaging | null = null;

export const initializeMessaging = async () => {
    try {
        if (typeof window !== 'undefined') {
            const isSupportedBrowser = await isSupported();
            if (isSupportedBrowser) {
                messagingInstance = getMessaging(app);
                return messagingInstance;
            }
        }
        return null;
    } catch (error) {
        console.error('Error initializing messaging:', error);
        return null;
    }
};

export const getMessagingInstance = () => {
    return messagingInstance;
};