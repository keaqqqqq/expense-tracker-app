// app/client-providers.tsx
'use client';

import { useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  return (
    <NotificationProvider userId={currentUser?.uid}>
      {children}
    </NotificationProvider>
  );
}