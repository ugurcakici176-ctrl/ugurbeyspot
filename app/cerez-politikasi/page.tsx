import type { Metadata } from "next";

import { pageOpenGraph } from "@/lib/seo";

import LegalPageClient from "@/components/legal/legal-page-client";

const TITLE = "Çerez Politikası";
const DESCRIPTION =
  "Uğur Bey Spot web sitesi çerez ve tarayıcı tercih teknolojilerine ilişkin bilgilendirme.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cerez-politikasi" },
  openGraph: pageOpenGraph({ url: "/cerez-politikasi", title: TITLE, description: DESCRIPTION }),
};

export default function CookiePolicyPage() {
  return <LegalPageClient pageKey="cookies" />;
}
