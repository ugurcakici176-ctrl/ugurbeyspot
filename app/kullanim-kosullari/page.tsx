import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";
import { getLegalPage, type LegalPageDocument } from "@/lib/legal-pages";

const TITLE = "Kullanım Koşulları";
const DESCRIPTION =
  "Uğur Bey Spot web sitesi kullanım koşulları.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kullanim-kosullari" },
  openGraph: pageOpenGraph({ url: "/kullanim-kosullari", title: TITLE, description: DESCRIPTION }),
};

export default async function TermsPage() {
  // Metin sunucuda üretilir: arama motorları ve ilk yükleme doğrudan içeriği görür.
  const page = JSON.parse(
    JSON.stringify(await getLegalPage("terms")),
  ) as LegalPageDocument;

  return <LegalPageClient pageKey="terms" initialPage={page} />;
}
