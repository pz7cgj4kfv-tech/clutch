import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// HomeFab (🏠 flottant) RETIRÉ (David 28.06) — l'accès au Hub est le lien « Toutes les pages » en bas du Profil.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clutch",
  description: "L'app de rencontres spontanées à Lausanne",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Clutch",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // maximumScale retiré → permet pinch-zoom sur la carte Leaflet
  // iOS zoom sur inputs évité avec font-size:16px dans globals.css
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Clutch"/>
        <meta name="theme-color" content="#5D1048"/>
        {/* Plausible Analytics */}
        <script defer data-domain="pz7cgj4kfv-tech.github.io" src="https://plausible.io/js/script.js"></script>
        {/* OneSignal Web Push SDK */}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{__html:`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "72f8da44-de01-4ad1-b1d8-6d2fbf33daf4",
              safari_web_id: "",
              notifyButton: { enable: false },
              allowLocalhostAsSecureOrigin: true,
            });
          });
        `}}/>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
