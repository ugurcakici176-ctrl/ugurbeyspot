import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";

const TITLE = "KVKK Aydınlatma Metni";
const DESCRIPTION =
  "Uğur Bey Spot kişisel verilerin işlenmesine ilişkin KVKK aydınlatma metni.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kvkk-aydinlatma-metni" },
  openGraph: pageOpenGraph({ url: "/kvkk-aydinlatma-metni", title: TITLE, description: DESCRIPTION }),
};

export default function KvkkPage() {
  return <LegalPageClient pageKey="kvkk" />;
}
