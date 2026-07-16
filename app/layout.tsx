import type {
  Metadata,
  Viewport,
} from "next";

import ControlGate from "@/components/dromocob-control/control-gate";
import GlobalSiteRuntime from "@/components/site/global-site-runtime";

import {
  DEFAULT_SEO,
  SITE,
} from "@/lib/constants";

import "./globals.css";
import "./legal.css";
import "./control-center-runtime.css";

export const dynamic =
  "force-dynamic";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://ugurbeyspot---ugurbeyspot-51329.europe-west4.hosted.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

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
  },

  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO.title,
    description:
      DEFAULT_SEO.description,
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
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
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