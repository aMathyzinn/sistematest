import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import SessionProvider from "@/components/SessionProvider";
import PhoneFrame from "@/components/layout/PhoneFrame";
import PersistentShell from "@/components/layout/PersistentShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Evolução Pessoal",
  description: "Sistema inteligente de gerenciamento de vida adaptativo inspirado em Solo Leveling",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sistema",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08080d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <PhoneFrame>
            <PersistentShell>
              {children}
            </PersistentShell>
          </PhoneFrame>
        </SessionProvider>
        <PWARegister />
      </body>
    </html>
  );
}
