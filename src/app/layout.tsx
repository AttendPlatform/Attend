import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/navigation/app-shell";
import "./globals.css";
import GoogleAnalytics from "@/components/analytics/google-analytics";

export const metadata: Metadata = {
  title: "Attend — Discover. Create. Share.",
  description:
    "Discover events around you and create personalized graphics worth sharing.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

import { Toaster } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleAnalytics />
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}