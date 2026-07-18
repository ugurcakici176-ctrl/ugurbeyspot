import type { Metadata } from "next";

import ProductsPageClient from "@/components/products/products-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_SEO.products.title,
  description: DEFAULT_PAGE_SEO.products.description,
  keywords: DEFAULT_PAGE_SEO.products.keywords,
  alternates: {
    canonical: "/urunler",
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
  openGraph: {
    type: "website",
    url: "/urunler",
    title: DEFAULT_PAGE_SEO.products.title,
    description: DEFAULT_PAGE_SEO.products.description,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_PAGE_SEO.products.title,
    description: DEFAULT_PAGE_SEO.products.description,
  },
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
