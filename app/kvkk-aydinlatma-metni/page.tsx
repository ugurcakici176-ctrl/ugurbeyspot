import type { Metadata } from "next";

import LegalPageClient from "@/components/legal/legal-page-client";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "Uğur Bey Spot kişisel verilerin işlenmesine ilişkin KVKK aydınlatma metni.",
};

export default function KvkkPage() {
  return <LegalPageClient pageKey="kvkk" />;
}
