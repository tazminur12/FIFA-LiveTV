import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

// ── Viewport (theme-color lives here in Next.js 15) ──────────────────────────
export const viewport: Viewport = {
  themeColor: "#08090d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "StreamZone — Live TV",
    template: "%s | StreamZone",
  },
  description:
    "Premium live TV streaming — sports, news, entertainment & more. Powered by your M3U playlist.",
  keywords: ["live tv", "streaming", "sports", "news", "m3u", "hls", "iptv"],
  authors: [{ name: "Tazminur Rahman Tanim", url: "https://tazminur.me" }],
  creator: "Tazminur Rahman Tanim",

  // ── PWA / manifest ──
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamZone",
  },

  // ── Open Graph ──
  openGraph: {
    type: "website",
    title: "StreamZone — Live TV",
    description: "Premium live TV streaming powered by your M3U playlist.",
    siteName: "StreamZone",
  },

  // ── Icons ──
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
    shortcut: "/icon.svg",
  },

  // ── Robots ──
  robots: { index: false, follow: false },
};

// ── Layout ────────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        {/* Apple PWA splash / mobile meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="StreamZone" />
        <meta name="application-name" content="StreamZone" />

        {/* MS Tiles (Windows) */}
        <meta name="msapplication-TileColor" content="#08090d" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased">
        {children}
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] Registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
