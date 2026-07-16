import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetailClient from "@/components/products/product-detail-client";
import { SITE } from "@/lib/constants";
import { getProductBySlug } from "@/lib/products";

function toAbsoluteUrl(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://ugurbeyspot---ugurbeyspot-51329.europe-west4.hosted.app";

  return new URL(value, base).toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, true);

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
    product.images.sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;

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
    openGraph: {
      type: "website",
      url: canonical,
      title: seoTitle,
      description: seoDescription,
      siteName: SITE.name,
      images: imageUrl
        ? [
            {
              url: toAbsoluteUrl(imageUrl) || imageUrl,
              alt: product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: imageUrl ? [toAbsoluteUrl(imageUrl) || imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug, true);

  if (!product) {
    notFound();
  }

  const firstImage = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://ugurbeyspot---ugurbeyspot-51329.europe-west4.hosted.app";

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
      url: `${siteUrl}/urunler/${product.slug}`,
      priceCurrency: SITE.currency,
      price: product.price,
      availability:
        product.stockStatus === "out_of_stock" || product.status === "sold_out"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 5,
      reviewCount: 1,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <ProductDetailClient slug={slug} />
    </>
  );
}
