import type { Metadata } from "next";

import { pageOpenGraph, pageTwitter } from "@/lib/seo";

import ContactPageClient from "@/components/contact/contact-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  // Başlık markayı zaten içeriyor; şablon ikinci kez eklemesin.
  title: { absolute: DEFAULT_PAGE_SEO.contact.title },
  description: DEFAULT_PAGE_SEO.contact.description,
  keywords: DEFAULT_PAGE_SEO.contact.keywords,
  alternates: { canonical: "/iletisim" },
  openGraph: pageOpenGraph({
    url: "/iletisim",
    title: DEFAULT_PAGE_SEO.contact.title,
    description: DEFAULT_PAGE_SEO.contact.description,
  }),
  twitter: pageTwitter({
    title: DEFAULT_PAGE_SEO.contact.title,
    description: DEFAULT_PAGE_SEO.contact.description,
  }),
};

export default function ContactPage() {
  return <ContactPageClient />;
}
