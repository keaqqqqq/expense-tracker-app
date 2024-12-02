import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { TransactionProvider } from "@/context/TransactionContext";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TransactionProvider>
            <ExpenseProvider>
              {children}
            </ExpenseProvider>
          </TransactionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
