import type {
  Metadata,
  Viewport,
} from "next";
import Script from "next/script";

import ControlGate from "@/components/dromocob-control/control-gate";
import GlobalSiteRuntime from "@/components/site/global-site-runtime";

import {
  DEFAULT_SEO,
  SITE,
} from "@/lib/constants";
import { BRAND_ASSETS } from "@/lib/branding";
import {
  GOOGLE_ANALYTICS_ID,
} from "@/lib/google-analytics";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";
import "./legal.css";
import "./control-center-runtime.css";

export const dynamic =
  "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: DEFAULT_SEO.title,
    template: `%s | ${SITE.name}`,
  },

  description:
    DEFAULT_SEO.description,

  keywords:
    DEFAULT_SEO.keywords,

  applicationName:
    SITE.name,

  authors: [{ name: SITE.name, url: SITE_URL }],

  creator:
    SITE.name,

  publisher:
    SITE.name,

  category:
    "shopping",

  manifest:
    "/manifest.webmanifest",

  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
      "x-default": "/",
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: "/",
    siteName: SITE.name,
    title: DEFAULT_SEO.title,
    description:
      DEFAULT_SEO.description,
    images: [
      {
        url: BRAND_ASSETS.social,
        width: 1200,
        height: 630,
        alt: "Uğur Bey Spot - Konya ikinci el eşya",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO.title,
    description:
      DEFAULT_SEO.description,
    images: [BRAND_ASSETS.social],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview":
        "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },

  referrer:
    "origin-when-cross-origin",

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE.name,
        alternateName: ["Uğur Bey Spot Konya", "Konya Spotçu"],
        inLanguage: "tr-TR",
      },
      {
        "@type": ["LocalBusiness", "Store"],
        "@id": `${SITE_URL}/#business`,
        name: SITE.name,
        url: SITE_URL,
        logo: `${SITE_URL}${BRAND_ASSETS.mark}`,
        description:
          "Konya'da ikinci el mobilya, beyaz eşya, elektronik ve ev eşyası alım satımı yapan spot mağaza.",
        areaServed: {
          "@type": "City",
          name: "Konya",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Konya",
          addressCountry: "TR",
        },
        priceRange: "₺₺",
      },
    ],
  };

  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />

        <Script
          id="google-consent-defaults"
          strategy="beforeInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>

        <Script
          id="google-tag-library"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="beforeInteractive"
        />

        <Script
          id="google-tag-config"
          strategy="beforeInteractive"
        >
          {`
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
      </head>

      <body>
        <ControlGate>
          <GlobalSiteRuntime>
            {children}
          </GlobalSiteRuntime>
        </ControlGate>
      </body>
    </html>
  );
}
