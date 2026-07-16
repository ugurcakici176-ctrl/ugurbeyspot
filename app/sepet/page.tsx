import type { Metadata } from "next";

import CartPageClient from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Sepet",
  description:
    "Teklif sepetinizdeki urunleri inceleyin ve WhatsApp uzerinden hizlica siparis surecini baslatin.",
};

export default function CartPage() {
  return <CartPageClient />;
}
