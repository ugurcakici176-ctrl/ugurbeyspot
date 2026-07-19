import type { Metadata } from "next";

import HomePageClient from "@/components/home/home-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: DEFAULT_PAGE_SEO.home.title },
  description: DEFAULT_PAGE_SEO.home.description,
  keywords: DEFAULT_PAGE_SEO.home.keywords,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomePageClient />;
}
