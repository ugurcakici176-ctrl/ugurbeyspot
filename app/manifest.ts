import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uğur Bey Spot",
    short_name: "Uğur Bey Spot",
    description:
      "Spot ürünler, güncel ürün seçenekleri ve mağaza iletişim bilgileri.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#181817",
    lang: "tr",
  };
}
