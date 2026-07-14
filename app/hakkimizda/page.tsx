import type { Metadata } from "next";

import AboutPageClient from "@/components/about/about-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: DEFAULT_PAGE_SEO.about.description,
  keywords: DEFAULT_PAGE_SEO.about.keywords,
};

export default function AboutPage() {
  return <AboutPageClient />;
}
