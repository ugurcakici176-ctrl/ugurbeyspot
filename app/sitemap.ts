import type { MetadataRoute } from "next";

import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import {
  absoluteUrl,
  SITE_URL,
} from "@/lib/site-url";

/**
 * Sitemap verisini belirli aralıklarla yeniler.
 * Ürün ve kategori değişikliklerinin sitemap'e yansımasını sağlar.
 */
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function normalizeDate(
  value: unknown,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    try {
      const date = (
        value as {
          toDate: () => Date;
        }
      ).toDate();

      return Number.isNaN(date.getTime())
        ? undefined
        : date;
    } catch {
      return undefined;
    }
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? undefined
      : date;
  }

  return undefined;
}

function normalizeAbsoluteUrl(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  try {
    const url = absoluteUrl(
      value.trim(),
    );

    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      return null;
    }

    parsedUrl.hash = "";

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function normalizeImages(
  values: Array<
    string | null | undefined
  >,
): string[] | undefined {
  const images = Array.from(
    new Set(
      values
        .map(normalizeAbsoluteUrl)
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ),
  );

  return images.length > 0
    ? images
    : undefined;
}

function deduplicateEntries(
  entries: SitemapEntry[],
): MetadataRoute.Sitemap {
  const entriesByUrl =
    new Map<string, SitemapEntry>();

  for (const entry of entries) {
    if (!entry.url) {
      continue;
    }

    entriesByUrl.set(
      entry.url,
      entry,
    );
  }

  return Array.from(
    entriesByUrl.values(),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap =
    [];

  let categoryEntries: MetadataRoute.Sitemap =
    [];

  try {
    const products =
      await getProducts();

    productEntries = products
      .filter(
        (product) =>
          Boolean(product.slug) &&
          !product.seo?.noIndex,
      )
      .map((product) => {
        const lastModified =
          normalizeDate(
            product.updatedAt,
          ) ||
          normalizeDate(
            product.createdAt,
          );

        const images =
          normalizeImages(
            product.images?.map(
              (image) =>
                image.url,
            ) || [],
          );

        return {
          url: absoluteUrl(
            `/urunler/${encodeURIComponent(
              product.slug,
            )}`,
          ),
          ...(lastModified
            ? { lastModified }
            : {}),
          changeFrequency:
            "weekly" as const,
          priority: 0.8,
          ...(images
            ? { images }
            : {}),
        };
      });
  } catch (error) {
    console.error(
      "Products could not be added to sitemap:",
      error,
    );
  }

  try {
    const categories =
      await getCategories();

    categoryEntries = categories
      .filter(
        (category) =>
          Boolean(category.slug) &&
          !category.seo?.noIndex,
      )
      .map((category) => {
        const lastModified =
          normalizeDate(
            category.updatedAt,
          ) ||
          normalizeDate(
            category.createdAt,
          );

        const images =
          normalizeImages([
            category.image?.url,
          ]);

        return {
          url: absoluteUrl(
            `/kategori/${encodeURIComponent(
              category.slug,
            )}`,
          ),
          ...(lastModified
            ? { lastModified }
            : {}),
          changeFrequency:
            "weekly" as const,
          priority: 0.85,
          ...(images
            ? { images }
            : {}),
        };
      });
  } catch (error) {
    console.error(
      "Categories could not be added to sitemap:",
      error,
    );
  }

  const staticEntries: MetadataRoute.Sitemap =
    [
      {
        url: SITE_URL,
        changeFrequency:
          "weekly",
        priority: 1,
      },
      {
        url: absoluteUrl("/konya-spot"),
        changeFrequency: "weekly",
        priority: 0.95,
      },
      {
        url: absoluteUrl(
          "/urunler",
        ),
        changeFrequency:
          "daily",
        priority: 0.9,
      },
      {
        url: absoluteUrl(
          "/hakkimizda",
        ),
        changeFrequency:
          "monthly",
        priority: 0.7,
      },
      {
        url: absoluteUrl(
          "/iletisim",
        ),
        changeFrequency:
          "monthly",
        priority: 0.7,
      },
      {
        url: absoluteUrl(
          "/gizlilik-politikasi",
        ),
        changeFrequency:
          "yearly",
        priority: 0.3,
      },
      {
        url: absoluteUrl(
          "/kvkk-aydinlatma-metni",
        ),
        changeFrequency:
          "yearly",
        priority: 0.3,
      },
      {
        url: absoluteUrl(
          "/cerez-politikasi",
        ),
        changeFrequency:
          "yearly",
        priority: 0.3,
      },
      {
        url: absoluteUrl(
          "/kullanim-kosullari",
        ),
        changeFrequency:
          "yearly",
        priority: 0.3,
      },
    ];

  return deduplicateEntries([
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
  ]);
}
