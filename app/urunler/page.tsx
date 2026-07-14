import type { Metadata } from "next";

import ProductsPageClient from "@/components/products/products-page-client";
import { DEFAULT_PAGE_SEO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ürünler",
  description: DEFAULT_PAGE_SEO.products.description,
  keywords: DEFAULT_PAGE_SEO.products.keywords,
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
