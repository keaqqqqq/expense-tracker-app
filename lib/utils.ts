import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from 'firebase/firestore';
import { GroupMember } from '@/types/Group';

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(clsx(inputs));
}

interface FirebaseTimestamp {
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
}

type TimestampValue = FirebaseTimestamp | Timestamp | number | null | undefined;

export const serializeTimestamp = (timestamp: TimestampValue): number | null => {
  if (!timestamp) return null;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }

  if (typeof timestamp === 'object' && timestamp !== null) {
    if ('toMillis' in timestamp && typeof timestamp.toMillis === 'function') {
      return timestamp.toMillis();
    }
    if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
      return timestamp.seconds * 1000;
    }
  }
  
  return typeof timestamp === 'number' ? timestamp : null;
};

type FirebaseValue = 
  | string
  | number
  | boolean
  | null 
  | undefined
  | TimestampValue
  | GroupMember
  | { [key: string]: unknown }
  | unknown[];

export const serializeFirebaseData = <T>(data: T): T => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeFirebaseData(item)) as T;
  }
  
  if (typeof data === 'object') {
    const serialized: { [key: string]: FirebaseValue } = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key.includes('_at') || key.includes('date') || key === 'timestamp') {
        serialized[key] = serializeTimestamp(value as TimestampValue);
      } else {
        serialized[key] = serializeFirebaseData(value);
      }
    }
    
    return serialized as T;
  }
  
  return data;
};