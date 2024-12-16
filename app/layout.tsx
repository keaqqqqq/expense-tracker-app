import "./globals.css";
import { Metadata } from 'next';
import { AuthProvider } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { ClientProviders } from "./client-providers";

export const metadata: Metadata = {
  title: 'ExpenseHive',
  description: 'Track and split expenses with friends',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Expense Tracker',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/icon-192x192.png' },
    ],
    other: [
      {
        url: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  applicationName: 'Expense Tracker',
  formatDetection: {
    telephone: false,
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name='application-name' content='ExpenseHive' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-TileColor' content='#000000' />
        <meta name='msapplication-tap-highlight' content='no' />
        <meta name='theme-color' content='#000000' />

        <link rel='icon' type='image/x-icon' href='/icons/favicon.ico' />
        <link rel='icon' type='image/svg+xml' href='/icons/favicon.svg' />
        <link rel='apple-touch-icon' href='/icons/apple-touch-icon.png' />
        <link rel='apple-touch-startup-image' href='/icons/apple-touch-icon.png' />
      </head>
      <body>
        <AuthProvider>
          <ClientProviders>
            <TransactionProvider>
              <ExpenseProvider>
                {children}
              </ExpenseProvider>
            </TransactionProvider>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}