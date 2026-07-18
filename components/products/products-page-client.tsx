"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/products/product-card";
import SiteChrome from "@/components/site/site-chrome";
import EmptyState from "@/components/ui/empty-state";
import Icon from "@/components/ui/icon";
import { getCategories } from "@/lib/categories";
import { SORT_OPTION_LABELS, SORT_OPTIONS } from "@/lib/constants";
import { getProducts, type ProductSort } from "@/lib/products";
import type { Category, Product } from "@/lib/types";

export default function ProductsPageClient({
  initialCategorySlug,
  initialProducts,
  initialCategories,
  heroTitle = "Ürünlerimizi Keşfedin",
  heroDescription = "Güncel ürün seçeneklerini inceleyin. Detaylı bilgi için bizimle doğrudan iletişime geçin.",
}: {
  initialCategorySlug?: string;
  initialProducts?: Product[];
  initialCategories?: Category[];
  heroTitle?: string;
  heroDescription?: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [categoryId, setCategoryId] = useState(() =>
    initialCategorySlug
      ? initialCategories?.find((item) => item.slug === initialCategorySlug)?.id || ""
      : "",
  );
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ProductSort>(SORT_OPTIONS.newest);

  useEffect(() => {
    if (initialProducts && initialCategories) {
      return;
    }

    let active = true;

    void Promise.all([getProducts(), getCategories()])
      .then(([productData, categoryData]) => {
        if (!active) return;

        setProducts(productData);
        setCategories(categoryData);

        const params = new URLSearchParams(window.location.search);
        const categorySlug = initialCategorySlug || params.get("kategori");

        if (categorySlug) {
          const matched = categoryData.find(
            (item) => item.slug === categorySlug,
          );

          if (matched) setCategoryId(matched.id);
        }
      })
      .catch((reason: unknown) => {
        console.error("Products could not be loaded:", reason);
      })
      .finally(() => undefined);

    return () => {
      active = false;
    };
  }, [initialCategories, initialCategorySlug, initialProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

    return [...products]
      .filter((product) => !categoryId || product.categoryId === categoryId)
      .filter((product) => {
        if (!normalizedSearch) return true;

        return [
          product.title,
          product.shortDescription,
          product.categoryName || "",
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sort === SORT_OPTIONS.priceAscending) return a.price - b.price;
        if (sort === SORT_OPTIONS.priceDescending) return b.price - a.price;

        if (sort === SORT_OPTIONS.featured) {
          const diff = Number(b.featured) - Number(a.featured);
          if (diff !== 0) return diff;
        }

        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [products, categoryId, search, sort]);

  return (
    <SiteChrome>
      <section className="page-hero page-hero--products">
        <div className="site-container">
          <span className="eyebrow">ÜRÜNLER</span>
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
        </div>
      </section>

      <section className="section products-section">
        <div className="site-container">
          <div className="product-toolbar">
            <label className="search-box">
              <Icon name="search" size={20} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ürün ara..."
              />
            </label>

            <label className="select-box">
              <span>Sırala</span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as ProductSort)
                }
              >
                {Object.entries(SORT_OPTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" size={17} />
            </label>
          </div>

          <div className="category-filter">
            <Link
              href="/urunler"
              className={categoryId === "" ? "is-active" : ""}
              onClick={(event) => {
                event.preventDefault();
                setCategoryId("");
              }}
            >
              Tümü
            </Link>

            {categories.map((category) => (
              <Link
                href={`/kategori/${category.slug}`}
                key={category.id}
                className={categoryId === category.id ? "is-active" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  setCategoryId(category.id);
                }}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="results-line">
            <span>{visibleProducts.length} ürün</span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title="Aradığınız ürün bulunamadı"
              description="Arama kelimenizi veya kategori filtrenizi değiştirin."
            />
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
