import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(clsx(inputs));
}

export const serializeTimestamp = (timestamp: any) => {
  if (!timestamp) return null;
  if (timestamp.toMillis) {
    return timestamp.toMillis();
  }
  if (timestamp.seconds) {
    return timestamp.seconds * 1000;
  }
  return timestamp;
};

export const serializeFirebaseData = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(serializeFirebaseData);
  }
  
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Handle Timestamp fields specifically
      if (key.includes('_at') || key.includes('date') || key === 'timestamp') {
        serialized[key] = serializeTimestamp(value);
      } else {
        serialized[key] = serializeFirebaseData(value);
      }
    }
    return serialized;
  }
  
  return data;
};
