import type { Metadata } from "next";

import { pageOpenGraph, pageTwitter } from "@/lib/seo";
import { notFound } from "next/navigation";
import { cache } from "react";

import ProductDetailClient from "@/components/products/product-detail-client";
import { SITE } from "@/lib/constants";
import { getProductBySlug } from "@/lib/products";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

// generateMetadata ve sayfa aynı istekte tek sorgu paylaşır.
// Pasif ürünler gizlidir; satılmış ürünler "satıldı" olarak gösterilir.
const loadProduct = cache(async (slug: string) => {
  const product = await getProductBySlug(slug, true);

  return product && product.status !== "passive" ? product : null;
});

function toAbsoluteUrl(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return new URL(value, `${SITE_URL}/`).toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) {
    return {
      title: "Urun bulunamadi",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = `/urunler/${product.slug}`;
  const imageUrl =
    product.seo.ogImageUrl ||
    [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;

  const seoTitle = product.seo.title || product.title;
  const seoDescription = product.seo.description || product.shortDescription;
  const noIndex = Boolean(product.seo.noIndex) || product.status !== "active";

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: product.seo.keywords,
    alternates: {
      canonical,
    },
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
    openGraph: pageOpenGraph({
      url: canonical,
      title: seoTitle,
      description: seoDescription,
      images: imageUrl
        ? [
            {
              url: toAbsoluteUrl(imageUrl) || imageUrl,
              alt: product.title,
            },
          ]
        : undefined,
    }),
    twitter: pageTwitter({
      title: seoTitle,
      description: seoDescription,
      images: imageUrl ? [toAbsoluteUrl(imageUrl) || imageUrl] : undefined,
    }),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await loadProduct(slug);

  if (!product) {
    notFound();
  }

  const firstImage = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    sku: product.id,
    image: product.images.map((item) => toAbsoluteUrl(item.url) || item.url),
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    category: product.categoryName || "Urun",
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/urunler/${product.slug}`),
      priceCurrency: SITE.currency,
      price: product.price,
      availability:
        product.stockStatus === "out_of_stock" || product.status === "sold_out"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#business`,
        name: SITE.name,
      },
    },
    additionalProperty: product.specifications.map((item) => ({
      "@type": "PropertyValue",
      name: item.name,
      value: item.value,
    })),
    ...(firstImage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: toAbsoluteUrl(firstImage.url) || firstImage.url,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "İkinci El Ürünler",
        item: absoluteUrl("/urunler"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: absoluteUrl(`/urunler/${product.slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
