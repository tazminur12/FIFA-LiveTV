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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  
  title: {
    default: "StreamZone — Live TV Streaming | Watch Sports, News & Entertainment",
    template: "%s | StreamZone - Premium Live TV",
  },
  
  description:
    "Watch premium live TV streaming with StreamZone. Access sports, news, entertainment, FIFA World Cup, and more. High-quality HLS/M3U IPTV streaming with no buffering.",
  
  keywords: [
    "live tv streaming",
    "sports streaming",
    "news channels",
    "entertainment live",
    "m3u playlist",
    "hls streaming",
    "iptv",
    "fifa world cup",
    "live sports",
    "online television",
  ],
  
  authors: [{ name: "Tazminur Rahman Tanim", url: "https://tazminur.me" }],
  creator: "Tazminur Rahman Tanim",
  publisher: "StreamZone",

  // ── PWA / manifest ──
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamZone",
  },

  // ── Open Graph (Social Media) ──
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    title: "StreamZone — Live TV Streaming",
    description:
      "Premium live TV streaming powered by your M3U playlist. Watch sports, news, and entertainment live.",
    siteName: "StreamZone",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "StreamZone Live TV Streaming",
        type: "image/jpeg",
      },
    ],
  },

  // ── Twitter / X ──
  twitter: {
    card: "summary_large_image",
    title: "StreamZone — Live TV Streaming",
    description: "Premium live TV with StreamZone. Watch sports, news & entertainment.",
    creator: "@tazminur12",
    images: ["/og-image.jpg"],
  },

  // ── Icons ──
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
    shortcut: "/icon.svg",
  },

  // ── Robots (Enable indexing for SEO) ──
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ── Verification ──
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },

  // ── Alternate Language Versions ──
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    languages: {
      "en-US": `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/en`,
      "ko-KR": `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/ko`,
    },
  },
};

// ── Layout ────────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StreamZone",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    description:
      "Premium live TV streaming platform with sports, news, and entertainment channels",
    applicationCategory: "MediaApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "Tazminur Rahman Tanim",
      url: "https://tazminur.me",
    },
  };

  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        {/* ── Canonical URL for SEO ── */}
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
        />

        {/* ── Preconnect to external services ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />

        {/* ── Schema.org Structured Data ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />

        {/* Apple PWA splash / mobile meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="StreamZone" />
        <meta name="application-name" content="StreamZone" />

        {/* ── SEO Meta Tags ── */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#08090d" />
        <meta name="color-scheme" content="dark" />

        {/* MS Tiles (Windows) */}
        <meta name="msapplication-TileColor" content="#08090d" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* ── Google Analytics & Site Verification ── */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
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
