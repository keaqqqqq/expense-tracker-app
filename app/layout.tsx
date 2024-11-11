import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
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
              <ExpenseProvider>
            {children}
              </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
