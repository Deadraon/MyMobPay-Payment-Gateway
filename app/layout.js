import "./globals.css";
import { Inter, Outfit, DM_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
  variable: "--font-outfit",
});

// ── Next.js 14: viewport config must be a separate export ─────
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B192C",
  colorScheme: "dark",
};

const BASE_URL = "https://mymob.tech";

export const metadata = {
  // ── Core ─────────────────────────────────────────────────────
  metadataBase: new URL(BASE_URL),
  title: {
    default: "MyMobPay — UPI Payment Gateway for SaaS Founders | 0% Fees",
    template: "%s | MyMobPay",
  },
  description:
    "Accept direct-to-bank UPI payments with 0% transaction fees. Instant automated verification across all UPI applications. Built for SaaS founders, indie hackers & developers.",
  keywords: [
    "UPI payment gateway",
    "UPI payment for SaaS",
    "payment gateway India",
    "0% transaction fee payment gateway",
    "direct UPI integration",
    "universal UPI QR",
    "instant UPI checkout",
    "direct bank payment",
    "webhook payment verification",
    "UPI QR code",
    "India payment API",
    "payment gateway for developers",
    "SaaS payment India",
    "mymobpay",
    "MyMobPay",
    "mymob pay",
    "mymob.tech",
  ],
  authors: [{ name: "MyMobPay", url: BASE_URL }],
  creator: "MyMobPay",
  publisher: "MyMobPay",
  category: "Finance & Payments",

  // ── Canonical & Robots ────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph (WhatsApp, Facebook, LinkedIn, Telegram) ───────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "MyMobPay",
    title: "MyMobPay — UPI Payments with 0% Transaction Fees",
    description:
      "Accept UPI payments directly to your bank account with instant auto-verification, signed webhooks, and zero transaction fees. Built for modern builders.",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "MyMobPay — Direct UPI Payment Gateway for SaaS Founders",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@mymobpay",
    creator: "@mymobpay",
    title: "MyMobPay — UPI Payments with 0% Transaction Fees",
    description:
      "Accept UPI payments directly to your bank. Instant verification, HMAC webhooks, zero gateway fees. Built for modern builders.",
    images: ["/og-banner.png"],
  },

  // ── App / PWA ─────────────────────────────────────────────────
  applicationName: "MyMobPay",
  referrer: "origin-when-cross-origin",

  // ── Icons ─────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ── Verification ──────────────────────────────────────────────
  // Add your Google Search Console & Bing verification codes here when ready:
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_CODE",
  //   bing: "YOUR_BING_VERIFICATION_CODE",
  // },
};

/**
 * Safely serialise a JSON-LD object for use inside a <script> tag.
 *
 * JSON.stringify() alone does NOT escape the sequence "</script>" which would
 * allow an attacker (or malicious dependency) to prematurely close the script
 * block and inject arbitrary HTML/JS (CWE-79).  We escape the three characters
 * that are dangerous inside an HTML script context using their Unicode escape
 * sequences so that the browser's HTML parser never sees a raw "</script>".
 *
 * This is the approach recommended by the OWASP JSON-LD cheat sheet and used
 * by frameworks such as Next.js's own <Head> implementation.
 */
function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')   // < → \u003c  (closes the </script> vector)
    .replace(/>/g, '\\u003e')   // > → \u003e  (defence-in-depth)
    .replace(/&/g, '\\u0026');  // & → \u0026  (prevents entity injection)
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Theme detection script running inline before rendering */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                  } else {
                    document.documentElement.classList.remove('light-theme');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        {/* Preload OG banner so it's cached fast */}
        <link rel="preload" as="image" href="/og-banner.png" />



        {/* JSON-LD Structured Data — WebSite (Signals official site name to Google) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MyMobPay",
              alternateName: ["mymobpay", "mymob.tech", "MyMob Pay"],
              url: BASE_URL,
            }),
          }}
        />

        {/* JSON-LD Structured Data — Organisation */}
        {/* safeJsonLd() escapes </script>, > and & so the script block cannot
            be prematurely closed regardless of future content changes. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyMobPay",
              alternateName: ["mymobpay", "mymob.tech", "MyMob Pay"],
              url: BASE_URL,
              logo: `${BASE_URL}/og-banner.png`,
              description:
                "Direct-to-bank UPI payment gateway with 0% transaction fees. Accept instant UPI payments with real-time automated verification.",
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                availableLanguage: ["English", "Hindi"],
              },
            })
          }}
        />

        {/* JSON-LD Structured Data — Software Application */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MyMobPay",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              url: BASE_URL,
              offers: {
                "@type": "Offer",
                price: "499",
                priceCurrency: "INR",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "499",
                  priceCurrency: "INR",
                  unitText: "MONTH",
                },
              },
              description:
                "UPI payment gateway for SaaS founders with 0% transaction fees, direct bank settlement, and automated payment verification.",
              screenshot: `${BASE_URL}/og-banner.png`,
              featureList: [
                "0% transaction fees",
                "Direct bank P2P settlement",
                "Automatic UPI payment verification",
                "HMAC-SHA256 signed webhooks",
                "Developer API integration",
                "Universal UPI application support",
                "Real-time order status",
                "Multi-merchant SaaS platform",
              ],
            }),
          }}
        />

        {/* JSON-LD Structured Data — FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is MyMobPay?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MyMobPay is a direct P2P UPI payment gateway that allows websites and apps to accept UPI payments with 0% transaction fees, sending money directly to your bank account.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much does MyMobPay cost?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MyMobPay charges a flat subscription fee of ₹499 per month with absolutely 0% transaction fees, unlike traditional gateways that charge 2% per transaction.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Which UPI apps does MyMobPay support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MyMobPay supports all standard UPI apps and any UPI-compatible application via QR code or direct payment intent.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does payment verification work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MyMobPay uses your bank transaction notification emails, forwarded via a Cloudflare email worker, to automatically detect and verify payments in real-time without any manual intervention.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${dmSans.variable} ${outfit.variable} ${inter.className} font-sans antialiased bg-slate-50 text-slate-900 selection:bg-blue-500/30 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
