import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientProvider from "./ClientProvider";
import { ExpenseProvider } from "@/context/ExpenseContext";
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
              <ExpenseProvider>
            {children}
              </ExpenseProvider>
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
