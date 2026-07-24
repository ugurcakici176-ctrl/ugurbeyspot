import type {
  MetadataRoute,
} from "next";

import {
  SITE,
} from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name:
      "Uğur Bey Spot | Konya İkinci El Eşya",

    short_name:
      "Uğur Bey Spot",

    description:
      "Konya'da ikinci el mobilya, beyaz eşya, elektronik ve spot ev ürünlerini keşfedin. Güncel ürünler ve mağaza iletişimi Uğur Bey Spot'ta.",

    start_url: "/",

    scope: "/",

    display:
      "standalone",

    orientation:
      "portrait-primary",

    background_color:
      "#ffffff",

    theme_color:
      "#181817",

    lang:
      SITE.locale || "tr-TR",

    dir:
      "ltr",

    categories: [
      "shopping",
      "business",
      "lifestyle",
    ],

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    screenshots: [
      {
        src: "/screenshots/home-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label:
          "Uğur Bey Spot mobil ana sayfası",
      },
      {
        src: "/screenshots/home-desktop.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label:
          "Uğur Bey Spot masaüstü ana sayfası",
      },
    ],

    shortcuts: [
      {
        name: "Ürünleri Gör",
        short_name: "Ürünler",
        description:
          "Güncel ikinci el ve spot ürünleri inceleyin.",
        url: "/urunler",
        icons: [
          {
            src: "/icons/shortcut-products.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "İletişime Geç",
        short_name: "İletişim",
        description:
          "Uğur Bey Spot mağazasıyla iletişime geçin.",
        url: "/iletisim",
        icons: [
          {
            src: "/icons/shortcut-contact.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}