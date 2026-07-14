import type { Metadata } from "next";

import LegalPageClient from "@/components/legal/legal-page-client";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "Uğur Bey Spot web sitesi kullanım koşulları.",
};

export default function TermsPage() {
  return <LegalPageClient pageKey="terms" />;
}
