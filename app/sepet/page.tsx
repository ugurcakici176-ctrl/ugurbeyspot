import type { Metadata } from "next";

import CartPageClient from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Teklif Sepeti",
  description:
    "Teklif sepetinizdeki ürünleri inceleyin ve mağazadan güncel stok ile kesin fiyat bilgisi alın.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
