import type { MetadataRoute } from "next";

import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function normalizeDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();

      return Number.isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function normalizeAbsoluteUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(value.trim(), `${SITE_URL}/`);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.hash = "";

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeImages(
  values: Array<string | null | undefined>,
): string[] | undefined {
  const images: string[] = [];

  for (const value of values) {
    const normalizedUrl = normalizeAbsoluteUrl(value);

    if (normalizedUrl && !images.includes(normalizedUrl)) {
      images.push(normalizedUrl);
    }
  }

  return images.length > 0 ? images : undefined;
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value.trim().replace(/^\/+|\/+$/g, "");

  return slug.length > 0 ? slug : null;
}

function deduplicateEntries(
  entries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const entryMap = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    if (!entry.url) {
      continue;
    }

    try {
      const url = new URL(entry.url);

      url.hash = "";

      entryMap.set(url.toString(), {
        ...entry,
        url: url.toString(),
      });
    } catch {
      console.warn("Geçersiz sitemap URL'si atlandı:", entry.url);
    }
  }

  return Array.from(entryMap.values());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/konya-spot"),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/urunler"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/hakkimizda"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/iletisim"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/gizlilik-politikasi"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/kvkk-aydinlatma-metni"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/cerez-politikasi"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/kullanim-kosullari"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = [];
  const productEntries: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();

    for (const category of categories) {
      const slug = normalizeSlug(category.slug);

      if (!slug || category.seo?.noIndex === true) {
        continue;
      }

      const lastModified =
        normalizeDate(category.updatedAt) ??
        normalizeDate(category.createdAt);

      const images = normalizeImages([category.image?.url]);

      const entry: SitemapEntry = {
        url: absoluteUrl(`/kategori/${encodeURIComponent(slug)}`),
        changeFrequency: "weekly",
        priority: 0.85,
      };

      if (lastModified) {
        entry.lastModified = lastModified;
      }

      if (images) {
        entry.images = images;
      }

      categoryEntries.push(entry);
    }
  } catch (error) {
    console.error(
      "Sitemap kategori verileri oluşturulamadı:",
      error,
    );
  }

  try {
    const products = await getProducts();

    for (const product of products) {
      const slug = normalizeSlug(product.slug);

      if (!slug || product.seo?.noIndex === true) {
        continue;
      }

      const lastModified =
        normalizeDate(product.updatedAt) ??
        normalizeDate(product.createdAt);

      const productImageUrls =
        product.images?.map((image) => image.url) ?? [];

      const images = normalizeImages(productImageUrls);

      const entry: SitemapEntry = {
        url: absoluteUrl(`/urunler/${encodeURIComponent(slug)}`),
        changeFrequency: "weekly",
        priority: 0.8,
      };

      if (lastModified) {
        entry.lastModified = lastModified;
      }

      if (images) {
        entry.images = images;
      }

      productEntries.push(entry);
    }
  } catch (error) {
    console.error(
      "Sitemap ürün verileri oluşturulamadı:",
      error,
    );
  }

  return deduplicateEntries([
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
  ]);
}