import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";
import { getLegalPage, type LegalPageDocument } from "@/lib/legal-pages";

const TITLE = "Çerez Politikası";
const DESCRIPTION =
  "Uğur Bey Spot web sitesi çerez ve tarayıcı tercih teknolojilerine ilişkin bilgilendirme.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cerez-politikasi" },
  openGraph: pageOpenGraph({ url: "/cerez-politikasi", title: TITLE, description: DESCRIPTION }),
};

export default async function CookiePolicyPage() {
  // Metin sunucuda üretilir: arama motorları ve ilk yükleme doğrudan içeriği görür.
  const page = JSON.parse(
    JSON.stringify(await getLegalPage("cookies")),
  ) as LegalPageDocument;

  return <LegalPageClient pageKey="cookies" initialPage={page} />;
}
