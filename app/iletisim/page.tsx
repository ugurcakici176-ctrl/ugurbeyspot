import type { Metadata } from "next";

import ContactPageClient from "@/components/contact/contact-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: DEFAULT_PAGE_SEO.contact.title,
  description: DEFAULT_PAGE_SEO.contact.description,
  keywords: DEFAULT_PAGE_SEO.contact.keywords,
  alternates: { canonical: "/iletisim" },
  openGraph: {
    type: "website",
    url: "/iletisim",
    title: DEFAULT_PAGE_SEO.contact.title,
    description: DEFAULT_PAGE_SEO.contact.description,
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
