import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await getProducts();
    productEntries = products.map((product) => ({
      url: absoluteUrl(`/urunler/${product.slug}`),
      lastModified: product.updatedAt || product.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
      images: product.images
        .map((image) => image.url)
        .filter((url) => /^https?:\/\//.test(url)),
    }));
  } catch (error) {
    console.error("Products could not be added to sitemap:", error);
  }

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/urunler`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/hakkimizda`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/iletisim`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/gizlilik-politikasi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/kvkk-aydinlatma-metni`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cerez-politikasi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/kullanim-kosullari`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...productEntries,
  ];
}
