import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await getProducts();
    productEntries = products
      .filter((product) => !product.seo?.noIndex)
      .map((product) => ({
        url: absoluteUrl(`/urunler/${product.slug}`),
        lastModified: product.updatedAt || product.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
        images: product.images
          .map((image) => absoluteUrl(image.url))
          .filter((url) => /^https?:\/\//.test(url)),
      }));
  } catch (error) {
    console.error("Products could not be added to sitemap:", error);
  }

  try {
    const categories = await getCategories();
    categoryEntries = categories
      .filter((category) => !category.seo?.noIndex)
      .map((category) => ({
        url: absoluteUrl(`/kategori/${category.slug}`),
        lastModified: category.updatedAt || category.createdAt,
        changeFrequency: "weekly",
        priority: 0.85,
        images: category.image?.url
          ? [absoluteUrl(category.image.url)]
          : undefined,
      }));
  } catch (error) {
    console.error("Categories could not be added to sitemap:", error);
  }

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/urunler`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/hakkimizda`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/iletisim`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/gizlilik-politikasi`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/kvkk-aydinlatma-metni`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cerez-politikasi`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/kullanim-kosullari`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
