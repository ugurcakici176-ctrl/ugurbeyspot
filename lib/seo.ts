import type { Metadata } from "next";

import { BRAND_ASSETS } from "@/lib/branding";
import { SITE } from "@/lib/constants";

type OpenGraph = NonNullable<Metadata["openGraph"]>;
type OpenGraphImage = { url: string; alt?: string; width?: number; height?: number };

export const DEFAULT_OG_IMAGE: OpenGraphImage = {
  url: BRAND_ASSETS.social,
  width: 1200,
  height: 630,
  alt: "Uğur Bey Spot - Konya ikinci el eşya mağazası",
};

/**
 * Next metadata'yı sığ birleştirir: sayfada openGraph tanımlanınca layout'taki
 * görsel, siteName ve locale kaybolur. Sayfalar bu yardımcıyla tam OG üretir.
 */
export function pageOpenGraph(input: {
  url: string;
  title: string;
  description: string;
  images?: OpenGraphImage[];
}): OpenGraph {
  return {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    url: input.url,
    title: input.title,
    description: input.description,
    images: input.images?.length ? input.images : [DEFAULT_OG_IMAGE],
  };
}

export function pageTwitter(input: {
  title: string;
  description: string;
  images?: string[];
}): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: input.title,
    description: input.description,
    images: input.images?.length ? input.images : [DEFAULT_OG_IMAGE.url],
  };
}
