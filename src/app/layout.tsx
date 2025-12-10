import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DetailFlow - Mobile Detailing Management",
  description: "Professional mobile auto detailing management platform",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DetailFlow",
    startupImage: [
      { url: "/icons/ios/1024.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/icons/android/android-launchericon-192-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/android/android-launchericon-512-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/ios/152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/ios/180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/ios/167.png", sizes: "167x167", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegistration />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
