import type { Metadata } from "next";

import ContactPageClient from "@/components/contact/contact-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "İletişim",
  description: DEFAULT_PAGE_SEO.contact.description,
  keywords: DEFAULT_PAGE_SEO.contact.keywords,
};

export default function ContactPage() {
  return <ContactPageClient />;
}
