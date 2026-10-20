import type { Metadata } from "next";

import { pageOpenGraph, pageTwitter } from "@/lib/seo";

import AboutPageClient from "@/components/about/about-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  // Başlık markayı zaten içeriyor; şablon ikinci kez eklemesin.
  title: { absolute: DEFAULT_PAGE_SEO.about.title },
  description: DEFAULT_PAGE_SEO.about.description,
  keywords: DEFAULT_PAGE_SEO.about.keywords,
  alternates: { canonical: "/hakkimizda" },
  openGraph: pageOpenGraph({
    url: "/hakkimizda",
    title: DEFAULT_PAGE_SEO.about.title,
    description: DEFAULT_PAGE_SEO.about.description,
  }),
  twitter: pageTwitter({
    title: DEFAULT_PAGE_SEO.about.title,
    description: DEFAULT_PAGE_SEO.about.description,
  }),
};

export default function AboutPage() {
  return <AboutPageClient />;
}
