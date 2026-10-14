import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";
import { getLegalPage, type LegalPageDocument } from "@/lib/legal-pages";

const TITLE = "KVKK Aydınlatma Metni";
const DESCRIPTION =
  "Uğur Bey Spot kişisel verilerin işlenmesine ilişkin KVKK aydınlatma metni.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kvkk-aydinlatma-metni" },
  openGraph: pageOpenGraph({ url: "/kvkk-aydinlatma-metni", title: TITLE, description: DESCRIPTION }),
};

export default async function KvkkPage() {
  // Metin sunucuda üretilir: arama motorları ve ilk yükleme doğrudan içeriği görür.
  const page = JSON.parse(
    JSON.stringify(await getLegalPage("kvkk")),
  ) as LegalPageDocument;

  return <LegalPageClient pageKey="kvkk" initialPage={page} />;
}
