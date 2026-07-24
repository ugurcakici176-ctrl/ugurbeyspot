import type { MetadataRoute } from "next";

import {
  absoluteUrl,
  SITE_URL,
} from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/giris",
          "/giris/",
          "/kayit",
          "/kayit/",
          "/hesabim",
          "/hesabim/",
          "/sepet",
          "/sepet/",
          "/odeme",
          "/odeme/",
          "/siparis",
          "/siparis/",
          "/arama",
          "/*?*sort=",
          "/*?*filter=",
          "/*?*page=",
        ],
      },
    ],

    sitemap: absoluteUrl(
      "/sitemap.xml",
    ),

    host: SITE_URL,
  };
}