import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductsPageClient from "@/components/products/products-page-client";
import { getCategoryBySlug } from "@/lib/categories";
import { getCategories } from "@/lib/categories";
import { SITE } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

function categoryDescription(name: string, description?: string): string {
  return (
    description?.trim() ||
    `Konya'da ikinci el ${name.toLocaleLowerCase("tr-TR")} seçeneklerini inceleyin. Güncel stok, fiyat ve hızlı bilgi için Uğur Bey Spot ile iletişime geçin.`
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Kategori Bulunamadı", robots: { index: false, follow: false } };
  }

  const canonical = `/kategori/${category.slug}`;
  const title =
    category.seo?.title?.trim() ||
    `Konya İkinci El ${category.name} | Uğur Bey Spot`;
  const description =
    category.seo?.description?.trim() ||
    categoryDescription(category.name, category.description);
  const imageSource = category.seo?.ogImageUrl || category.image?.url;
  const image = imageSource ? absoluteUrl(imageSource) : undefined;
  const noIndex = Boolean(category.seo?.noIndex);

  return {
    title: { absolute: title },
    description,
    keywords: [
      `Konya ikinci el ${category.name}`,
      `Konya spot ${category.name}`,
      `ikinci el ${category.name} fiyatları`,
      "Uğur Bey Spot",
    ],
    alternates: { canonical },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url: canonical,
      title,
      description,
      images: image ? [{ url: image, alt: category.image?.alt || category.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const description = categoryDescription(category.name, category.description);
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const categoryProducts = products.filter(
    (product) => product.categoryId === category.id,
  );
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(`/kategori/${category.slug}`)}#collection`,
        url: absoluteUrl(`/kategori/${category.slug}`),
        name: `Konya İkinci El ${category.name}`,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@type": "Thing", name: category.name },
        primaryImageOfPage: category.image?.url
          ? { "@type": "ImageObject", url: absoluteUrl(category.image.url) }
          : undefined,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: categoryProducts.length,
          itemListElement: categoryProducts.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            url: absoluteUrl(`/urunler/${product.slug}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Ürünler", item: absoluteUrl("/urunler") },
          { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(`/kategori/${category.slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <ProductsPageClient
        initialCategorySlug={category.slug}
        initialProducts={products}
        initialCategories={categories}
        heroTitle={`Konya İkinci El ${category.name}`}
        heroDescription={description}
      />
    </>
  );
}
