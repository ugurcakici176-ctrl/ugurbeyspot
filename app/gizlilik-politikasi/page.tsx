import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";

const TITLE = "Gizlilik Politikası";
const DESCRIPTION =
  "Uğur Bey Spot gizlilik politikası ve veri işleme süreçleri hakkında genel bilgilendirme.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/gizlilik-politikasi" },
  openGraph: pageOpenGraph({ url: "/gizlilik-politikasi", title: TITLE, description: DESCRIPTION }),
};

export default function PrivacyPolicyPage() {
  return <LegalPageClient pageKey="privacy" />;
}
