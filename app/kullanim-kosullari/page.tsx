import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";

const TITLE = "Kullanım Koşulları";
const DESCRIPTION =
  "Uğur Bey Spot web sitesi kullanım koşulları.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kullanim-kosullari" },
  openGraph: pageOpenGraph({ url: "/kullanim-kosullari", title: TITLE, description: DESCRIPTION }),
};

export default function TermsPage() {
  return <LegalPageClient pageKey="terms" />;
}
