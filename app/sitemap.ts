import type { MetadataRoute } from "next";

import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Sitemap verisini saatte bir yeniden oluşturur.
 */
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * Firestore Timestamp, Date, string veya number değerlerini
 * geçerli JavaScript Date nesnesine dönüştürür.
 */
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

/**
 * Slug değerini sitemap için güvenli hâle getirir.
 */
function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value.trim().replace(/^\/+|\/+$/g, "");

  return slug.length > 0 ? slug : null;
}

/**
 * Aynı URL'nin sitemap içinde birden fazla kez görünmesini engeller.
 */
function deduplicateEntries(
  entries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const entriesByUrl = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    if (!entry.url) {
      continue;
    }

    try {
      const normalizedUrl = new URL(entry.url);

      normalizedUrl.hash = "";

      entriesByUrl.set(normalizedUrl.toString(), {
        ...entry,
        url: normalizedUrl.toString(),
      });
    } catch {
      console.warn("Geçersiz sitemap URL'si atlandı:", entry.url);
    }
  }

  return Array.from(entriesByUrl.values());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
   * Sabit sayfalar
   */
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

  /*
   * Kategoriler
   */
  try {
    const categories = await getCategories();

    for (const category of categories) {
      const slug = normalizeSlug(category.slug);

      if (!slug) {
        continue;
      }

      if (category.seo?.noIndex === true) {
        continue;
      }

      const lastModified =
        normalizeDate(category.updatedAt) ??
        normalizeDate(category.createdAt);

      const entry: SitemapEntry = {
        url: absoluteUrl(
          `/kategori/${encodeURIComponent(slug)}`,
        ),
        changeFrequency: "weekly",
        priority: 0.85,
      };

      if (lastModified) {
        entry.lastModified = lastModified;
      }

      categoryEntries.push(entry);
    }
  } catch (error) {
    console.error(
      "Kategoriler sitemap'e eklenemedi:",
      error,
    );
  }

  /*
   * Ürünler
   */
  try {
    const products = await getProducts();

    for (const product of products) {
      const slug = normalizeSlug(product.slug);

      if (!slug) {
        continue;
      }

      if (product.seo?.noIndex === true) {
        continue;
      }

      const lastModified =
        normalizeDate(product.updatedAt) ??
        normalizeDate(product.createdAt);

      const entry: SitemapEntry = {
        url: absoluteUrl(
          `/urunler/${encodeURIComponent(slug)}`,
        ),
        changeFrequency: "weekly",
        priority: 0.8,
      };

      if (lastModified) {
        entry.lastModified = lastModified;
      }

      productEntries.push(entry);
    }
  } catch (error) {
    console.error(
      "Ürünler sitemap'e eklenemedi:",
      error,
    );
  }

  return deduplicateEntries([
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
  ]);
}