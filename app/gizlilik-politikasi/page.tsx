import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";
import { getLegalPage, type LegalPageDocument } from "@/lib/legal-pages";

const TITLE = "Gizlilik Politikası";
const DESCRIPTION =
  "Uğur Bey Spot gizlilik politikası ve veri işleme süreçleri hakkında genel bilgilendirme.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/gizlilik-politikasi" },
  openGraph: pageOpenGraph({ url: "/gizlilik-politikasi", title: TITLE, description: DESCRIPTION }),
};

export default async function PrivacyPolicyPage() {
  // Metin sunucuda üretilir: arama motorları ve ilk yükleme doğrudan içeriği görür.
  const page = JSON.parse(
    JSON.stringify(await getLegalPage("privacy")),
  ) as LegalPageDocument;

  return <LegalPageClient pageKey="privacy" initialPage={page} />;
}
