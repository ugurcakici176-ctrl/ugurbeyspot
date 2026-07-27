import type { Metadata, Viewport } from "next";
import Script from "next/script";

import ControlGate from "@/components/dromocob-control/control-gate";
import GlobalSiteRuntime from "@/components/site/global-site-runtime";

import { BRAND_ASSETS } from "@/lib/branding";
import { DEFAULT_SEO, SITE } from "@/lib/constants";
import {
  GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID,
} from "@/lib/google-analytics";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";
import "./legal.css";
import "./control-center-runtime.css";

function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}

const businessPhone = process.env.NEXT_PUBLIC_BUSINESS_PHONE?.trim();
const businessEmail = process.env.NEXT_PUBLIC_BUSINESS_EMAIL?.trim();
const streetAddress = process.env.NEXT_PUBLIC_BUSINESS_STREET_ADDRESS?.trim();
const postalCode = process.env.NEXT_PUBLIC_BUSINESS_POSTAL_CODE?.trim();
const district = process.env.NEXT_PUBLIC_BUSINESS_DISTRICT?.trim();
const mapsUrl = process.env.NEXT_PUBLIC_BUSINESS_MAPS_URL?.trim();
const latitude = Number(process.env.NEXT_PUBLIC_BUSINESS_LATITUDE);
const longitude = Number(process.env.NEXT_PUBLIC_BUSINESS_LONGITUDE);
const openingHours = process.env.NEXT_PUBLIC_BUSINESS_OPENING_HOURS?.trim();

const socialProfiles = [
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_FACEBOOK_URL,
  process.env.NEXT_PUBLIC_YOUTUBE_URL,
].filter((value): value is string => Boolean(value?.trim()));

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_SEO.title,
    template: `%s | ${SITE.name}`,
  },
  description: DEFAULT_SEO.description,
  keywords: DEFAULT_SEO.keywords,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "shopping",
  manifest: "/manifest.webmanifest",
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
    description: DEFAULT_SEO.description,
    images: [
      {
        url: BRAND_ASSETS.social,
        width: 1200,
        height: 630,
        alt: "Uğur Bey Spot - Konya ikinci el eşya mağazası",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    images: [BRAND_ASSETS.social],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },
  referrer: "origin-when-cross-origin",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
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
}: Readonly<{ children: React.ReactNode }>) {
  const hasGtm = Boolean(GOOGLE_TAG_MANAGER_ID);
  const hasDirectGa = !hasGtm && Boolean(GOOGLE_ANALYTICS_ID);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE.name,
        alternateName: ["Uğur Bey Spot Konya", "Konya Spotçu"],
        inLanguage: "tr-TR",
        publisher: { "@id": `${SITE_URL}/#business` },
      },
      {
        "@type": ["LocalBusiness", "Store"],
        "@id": `${SITE_URL}/#business`,
        name: SITE.name,
        url: SITE_URL,
        image: absoluteUrl(BRAND_ASSETS.social),
        logo: absoluteUrl(BRAND_ASSETS.mark),
        description:
          "Konya'da ikinci el mobilya, beyaz eşya, elektronik ve ev eşyası alım satımı yapan spot mağaza.",
        ...(businessPhone ? { telephone: businessPhone } : {}),
        ...(businessEmail ? { email: businessEmail } : {}),
        ...(mapsUrl ? { hasMap: mapsUrl } : {}),
        priceRange: "₺₺",
        currenciesAccepted: "TRY",
        paymentAccepted: "Cash, Credit Card",
        areaServed: {
          "@type": "City",
          name: "Konya",
        },
        address: {
          "@type": "PostalAddress",
          ...(streetAddress ? { streetAddress } : {}),
          ...(district ? { addressLocality: district } : {}),
          ...(postalCode ? { postalCode } : {}),
          addressRegion: "Konya",
          addressCountry: "TR",
        },
        ...(Number.isFinite(latitude) && Number.isFinite(longitude)
          ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude,
              longitude,
            },
          }
          : {}),
        ...(openingHours ? { openingHours } : {}),
        ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
      },
    ],
  };

  return (
    <html lang="tr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />

        {(hasGtm || hasDirectGa) && (
          <Script id="google-consent-defaults" strategy="beforeInteractive">
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
        )}

        {hasGtm && (
          <Script id="google-tag-manager" strategy="beforeInteractive">
            {`
              (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
            `}
          </Script>
        )}

        {hasDirectGa && (
          <>
            <Script
              id="google-tag-library"
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
              strategy="beforeInteractive"
            />
            <Script id="google-tag-config" strategy="beforeInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                  send_page_view: false
                });
              `}
            </Script>
          </>
        )}
      </head>

      <body>
        {hasGtm && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}

        <ControlGate>
          <GlobalSiteRuntime>{children}</GlobalSiteRuntime>
        </ControlGate>
      </body>
    </html>
  );
}
