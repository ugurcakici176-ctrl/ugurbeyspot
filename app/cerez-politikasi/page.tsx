import type { Metadata } from "next";

import LegalPageClient from "@/components/legal/legal-page-client";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description:
    "Uğur Bey Spot web sitesi çerez ve tarayıcı tercih teknolojilerine ilişkin bilgilendirme.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CookiePolicyPage() {
  return <LegalPageClient pageKey="cookies" />;
}
