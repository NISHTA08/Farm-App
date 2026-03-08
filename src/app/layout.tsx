import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import OfflineIndicator from "@/components/OfflineIndicator";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "KhethAi - Smart Farming",
  description:
    "AI-powered crop disease diagnosis and farm management for Indian farmers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KhethAi",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-kh-bg text-kh-text antialiased font-body">
        <I18nProvider>
          <ServiceWorkerRegistrar />
          <main className="safe-bottom">{children}</main>
          <OfflineIndicator />
        </I18nProvider>
      </body>
    </html>
  );
}
