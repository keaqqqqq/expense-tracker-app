import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientProvider from "./ClientProvider";
import { FriendsProvider } from "@/context/FriendsContext";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientProvider>
            {children}
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
