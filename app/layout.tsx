"use client";
import { Provider } from "react-redux";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import store from "@/store/store";
import { metadata } from "./metadata";

export default function RootLayout({ children }: {children: React.ReactNode}) {

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Provider store={store}>
          {children}
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
