import type { Metadata } from "next";

import LegalPageClient from "@/components/legal/legal-page-client";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "Uğur Bey Spot gizlilik politikası ve veri işleme süreçleri hakkında genel bilgilendirme.",
};

export default function PrivacyPolicyPage() {
  return <LegalPageClient pageKey="privacy" />;
}
