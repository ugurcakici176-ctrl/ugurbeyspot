import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uğur Bey Spot",
    short_name: "Uğur Bey Spot",
    description:
      "Konya'da ikinci el eşya alım satımı, spot ürünler ve güncel mağaza seçenekleri.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#181817",
    lang: "tr",
  };
}
