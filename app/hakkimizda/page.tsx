import type { Metadata } from "next";

import AboutPageClient from "@/components/about/about-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_SEO.about.title,
  description: DEFAULT_PAGE_SEO.about.description,
  keywords: DEFAULT_PAGE_SEO.about.keywords,
  alternates: { canonical: "/hakkimizda" },
  openGraph: {
    type: "website",
    url: "/hakkimizda",
    title: DEFAULT_PAGE_SEO.about.title,
    description: DEFAULT_PAGE_SEO.about.description,
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
