"use client";

import Link from "next/link";

import {
  type PointerEvent,
  useEffect,
  useState,
} from "react";

import ProductCard from "@/components/products/product-card";
import SiteChrome from "@/components/site/site-chrome";
import EmptyState from "@/components/ui/empty-state";
import Icon from "@/components/ui/icon";
import LoadingScreen from "@/components/ui/loading-screen";

import {
  getBanners,
} from "@/lib/banners";

import {
  getCategories,
} from "@/lib/categories";

import {
  getFeaturedProducts,
} from "@/lib/products";

import {
  getHomepageContent,
} from "@/lib/site-content";

import type {
  CampaignBanner,
  Category,
  HomepageContent,
  Product,
} from "@/lib/types";

interface HomeData {
  content: HomepageContent;
  categories: Category[];
  products: Product[];
  banners: CampaignBanner[];
}

export default function HomePageClient() {
  const [
    data,
    setData,
  ] = useState<HomeData | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    pageReady,
    setPageReady,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getHomepageContent(),
      getCategories(),
      getFeaturedProducts(),
      getBanners(),
    ])
      .then(
        ([
          content,
          categories,
          products,
          banners,
        ]) => {
          if (!active) {
            return;
          }

          setData({
            content,
            categories,
            products,
            banners,
          });

          window.requestAnimationFrame(
            () => {
              if (active) {
                setPageReady(true);
              }
            },
          );
        },
      )
      .catch(
        (reason: unknown) => {
          console.error(
            "Homepage could not be loaded:",
            reason,
          );

          if (active) {
            setError(
              "Ana sayfa içerikleri şu anda yüklenemedi.",
            );
          }
        },
      );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    const elements =
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-reveal]",
        ),
      );

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      elements.forEach(
        (element) => {
          element.classList.add(
            "is-visible",
          );
        },
      );

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                entry.isIntersecting
              ) {
                entry.target.classList.add(
                  "is-visible",
                );

                observer.unobserve(
                  entry.target,
                );
              }
            },
          );
        },
        {
          threshold: 0.14,
          rootMargin:
            "0px 0px -8% 0px",
        },
      );

    elements.forEach(
      (element) => {
        observer.observe(element);
      },
    );

    return () => {
      observer.disconnect();
    };
  }, [data]);

  function handleHeroPointerMove(
    event: PointerEvent<HTMLElement>,
  ): void {
    const element =
      event.currentTarget;

    const rect =
      element.getBoundingClientRect();

    const x =
      (
        event.clientX -
        rect.left
      ) / rect.width;

    const y =
      (
        event.clientY -
        rect.top
      ) / rect.height;

    element.style.setProperty(
      "--hero-x",
      `${(x - 0.5) * 18}px`,
    );

    element.style.setProperty(
      "--hero-y",
      `${(y - 0.5) * 18}px`,
    );
  }

  function resetHeroPointer(
    event: PointerEvent<HTMLElement>,
  ): void {
    event.currentTarget
      .style
      .setProperty(
        "--hero-x",
        "0px",
      );

    event.currentTarget
      .style
      .setProperty(
        "--hero-y",
        "0px",
      );
  }

  if (
    !data &&
    !error
  ) {
    return (
      <LoadingScreen label="Mağaza hazırlanıyor" />
    );
  }

  if (!data) {
    return (
      <SiteChrome>
        <section className="page-shell">
          <div className="site-container">
            <EmptyState
              icon="sparkles"
              title="İçerik şu anda görüntülenemiyor"
              description={
                error ||
                "Lütfen kısa süre sonra tekrar deneyin."
              }
            />
          </div>
        </section>
      </SiteChrome>
    );
  }

  const {
    content,
    categories,
    products,
    banners,
  } = data;

  const heroImages = [
    ...content.hero.images,
  ].sort(
    (a, b) =>
      a.sortOrder -
      b.sortOrder,
  );

  const activeTrustItems =
    content.trustItems
      .filter(
        (item) =>
          item.status ===
          "active",
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder,
      );

  const activeWhyItems =
    content.whyUsSection.items
      .filter(
        (item) =>
          item.status ===
          "active",
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder,
      );

  const activeBanner =
    banners[0] || null;

  return (
    <SiteChrome>
      <div
        className={
          `home-experience ${
            pageReady
              ? "is-ready"
              : ""
          }`
        }
      >
        <section
          className="hero hero--premium"
          onPointerMove={
            handleHeroPointerMove
          }
          onPointerLeave={
            resetHeroPointer
          }
        >
          <div className="hero-noise" />

          <div className="hero__orb hero__orb--one" />
          <div className="hero__orb hero__orb--two" />

          <div className="hero-grid-lines" />

          <div className="site-container hero__grid">
            <div className="hero__content">
              <span className="eyebrow hero-enter hero-enter--one">
                {
                  content
                    .hero
                    .eyebrow
                }
              </span>

              <h1 className="hero-enter hero-enter--two">
                {
                  content
                    .hero
                    .title
                }

                <span>
                  {
                    content
                      .hero
                      .highlightedText
                  }
                </span>
              </h1>

              <p className="hero-enter hero-enter--three">
                {
                  content
                    .hero
                    .description
                }
              </p>

              <div className="hero__actions hero-enter hero-enter--four">
                <Link
                  className="button button--dark button--premium"
                  href={
                    content
                      .hero
                      .primaryButton
                      .href
                  }
                  target={
                    content
                      .hero
                      .primaryButton
                      .target
                  }
                >
                  <span>
                    {
                      content
                        .hero
                        .primaryButton
                        .label
                    }
                  </span>

                  <span className="button__icon">
                    <Icon
                      name="arrow-right"
                      size={19}
                    />
                  </span>
                </Link>

                <Link
                  className="button button--ghost"
                  href={
                    content
                      .hero
                      .secondaryButton
                      .href
                  }
                  target={
                    content
                      .hero
                      .secondaryButton
                      .target
                  }
                >
                  {
                    content
                      .hero
                      .secondaryButton
                      .label
                  }
                </Link>
              </div>

              <div className="hero-metrics hero-enter hero-enter--five">
                <div>
                  <strong>
                    {categories.length}+
                  </strong>

                  <span>
                    Ürün Kategorisi
                  </span>
                </div>

                <div>
                  <strong>
                    {products.length}+
                  </strong>

                  <span>
                    Öne Çıkan Ürün
                  </span>
                </div>

                <div>
                  <strong>
                    Canlı
                  </strong>

                  <span>
                    Mağaza İletişimi
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-showcase hero-enter hero-enter--visual">
              <div className="hero-showcase__halo" />

              <div className="hero-showcase__panel">
                <span className="hero-showcase__eyebrow">
                  SEÇİLMİŞ ÜRÜNLER
                </span>

                {heroImages[0] ? (
                  <img
                    className="hero-showcase__main-image"
                    src={
                      heroImages[0].url
                    }
                    alt={
                      heroImages[0].alt ||
                      "Öne çıkan ürün"
                    }
                  />
                ) : (
                  <div className="hero-showcase__placeholder">
                    <span>UB</span>

                    <strong>
                      Seçkimiz yakında burada.
                    </strong>
                  </div>
                )}

                <div className="hero-showcase__gradient" />

                <div className="hero-showcase__meta">
                  <span className="hero-showcase__live-dot" />

                  <span>
                    Güncel ürün seçkisi
                  </span>

                  <Icon
                    name="sparkles"
                    size={17}
                  />
                </div>
              </div>

              {heroImages[1] && (
                <div className="floating-card floating-card--top">
                  <img
                    src={
                      heroImages[1].url
                    }
                    alt={
                      heroImages[1].alt ||
                      "Ürün"
                    }
                  />
                </div>
              )}

              {heroImages[2] && (
                <div className="floating-card floating-card--bottom">
                  <img
                    src={
                      heroImages[2].url
                    }
                    alt={
                      heroImages[2].alt ||
                      "Ürün"
                    }
                  />
                </div>
              )}

              <div className="hero-pill">
                <span className="hero-pill__dot" />

                Mağaza ile doğrudan iletişim
              </div>
            </div>
          </div>

          <div className="hero-scroll-indicator">
            <span />

            Keşfet
          </div>
        </section>

        {activeTrustItems.length >
          0 && (
          <section
            className="trust-strip"
            data-reveal
          >
            <div className="site-container trust-strip__grid">
              {activeTrustItems.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={item.id}
                    className="trust-item"
                    style={{
                      transitionDelay:
                        `${index * 70}ms`,
                    }}
                  >
                    <span>
                      <Icon
                        name={
                          item.icon
                        }
                        size={22}
                      />
                    </span>

                    <div>
                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <p>
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )}

        <section className="section section--soft">
          <div className="site-container">
            <div
              className="section-heading"
              data-reveal
            >
              <div>
                <span className="eyebrow">
                  {
                    content
                      .categoriesSection
                      .eyebrow
                  }
                </span>

                <h2>
                  {
                    content
                      .categoriesSection
                      .title
                  }
                </h2>
              </div>

              <p>
                {
                  content
                    .categoriesSection
                    .description
                }
              </p>
            </div>

            {categories.length >
            0 ? (
              <div className="category-grid">
                {categories
                  .slice(0, 8)
                  .map(
                    (
                      category,
                      index,
                    ) => (
                      <Link
                        href={`/urunler?kategori=${category.slug}`}
                        className="category-card category-card--premium"
                        key={
                          category.id
                        }
                        data-reveal
                        style={{
                          transitionDelay:
                            `${(index % 4) * 80}ms`,
                        }}
                      >
                        <div className="category-card__image">
                          {category.image ? (
                            <img
                              src={
                                category
                                  .image
                                  .url
                              }
                              alt={
                                category
                                  .image
                                  .alt ||
                                category.name
                              }
                              loading="lazy"
                            />
                          ) : (
                            <span className="category-card__index">
                              {String(
                                index + 1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>
                          )}

                          <span className="category-card__image-veil" />
                        </div>

                        <div className="category-card__content">
                          <span>
                            {
                              category.description ||
                              "Ürünleri keşfedin"
                            }
                          </span>

                          <h3>
                            {
                              category.name
                            }
                          </h3>
                        </div>

                        <span className="category-card__arrow">
                          <Icon
                            name="arrow-up-right"
                            size={18}
                          />
                        </span>
                      </Link>
                    ),
                  )}
              </div>
            ) : (
              <EmptyState
                title="Kategoriler hazırlanıyor"
                description="Yeni ürün kategorileri yakında burada olacak."
              />
            )}
          </div>
        </section>

        <section className="section">
          <div className="site-container">
            <div
              className="section-heading section-heading--actions"
              data-reveal
            >
              <div>
                <span className="eyebrow">
                  {
                    content
                      .featuredProductsSection
                      .eyebrow
                  }
                </span>

                <h2>
                  {
                    content
                      .featuredProductsSection
                      .title
                  }
                </h2>
              </div>

              <Link
                className="text-link text-link--animated"
                href="/urunler"
              >
                Tüm Ürünler

                <Icon
                  name="arrow-right"
                  size={18}
                />
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="product-grid">
                {products.map(
                  (
                    product,
                    index,
                  ) => (
                    <div
                      key={product.id}
                      data-reveal
                      style={{
                        transitionDelay:
                          `${(index % 4) * 75}ms`,
                      }}
                    >
                      <ProductCard
                        product={
                          product
                        }
                      />
                    </div>
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                title="Ürün seçkisi hazırlanıyor"
                description="Öne çıkan ürünler admin panelinden eklendiğinde burada görünecek."
              />
            )}
          </div>
        </section>

        {activeBanner && (
          <section className="section section--flush-top">
            <div className="site-container">
              <article
                className="campaign-banner campaign-banner--premium"
                data-reveal
              >
                {activeBanner.desktopImage && (
                  <img
                    className="campaign-banner__image"
                    src={
                      activeBanner
                        .desktopImage
                        .url
                    }
                    alt={
                      activeBanner
                        .desktopImage
                        .alt ||
                      activeBanner.title
                    }
                  />
                )}

                <div className="campaign-banner__veil" />
                <div className="campaign-banner__noise" />

                <div className="campaign-banner__content">
                  <span className="eyebrow eyebrow--light">
                    {
                      content
                        .campaignSection
                        .eyebrow
                    }
                  </span>

                  <h2>
                    {
                      activeBanner.title
                    }
                  </h2>

                  <p>
                    {
                      activeBanner.description
                    }
                  </p>

                  <Link
                    className="button button--light button--premium"
                    href={
                      activeBanner
                        .button
                        .href
                    }
                    target={
                      activeBanner
                        .button
                        .target
                    }
                  >
                    {
                      activeBanner
                        .button
                        .label
                    }

                    <span className="button__icon">
                      <Icon
                        name="arrow-right"
                        size={19}
                      />
                    </span>
                  </Link>
                </div>

                <span className="campaign-banner__mark">
                  UB
                </span>
              </article>
            </div>
          </section>
        )}

        <section className="section section--dark">
          <div className="site-container">
            <div
              className="section-heading section-heading--dark"
              data-reveal
            >
              <div>
                <span className="eyebrow eyebrow--light">
                  {
                    content
                      .whyUsSection
                      .eyebrow
                  }
                </span>

                <h2>
                  {
                    content
                      .whyUsSection
                      .title
                  }
                </h2>
              </div>

              <p>
                {
                  content
                    .whyUsSection
                    .description
                }
              </p>
            </div>

            <div className="why-grid">
              {activeWhyItems.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    className="why-card why-card--premium"
                    key={item.id}
                    data-reveal
                    style={{
                      transitionDelay:
                        `${index * 90}ms`,
                    }}
                  >
                    <div className="why-card__top">
                      <span className="why-card__icon">
                        <Icon
                          name={
                            item.icon
                          }
                          size={24}
                        />
                      </span>

                      <span className="why-card__index">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </div>

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {
                        item.description
                      }
                    </p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        {content.storeSection.status ===
          "active" && (
          <section className="section">
            <div
              className="site-container store-story"
              data-reveal
            >
              <div className="store-story__visual store-story__visual--premium">
                {content.storeSection.image ? (
                  <img
                    src={
                      content
                        .storeSection
                        .image
                        .url
                    }
                    alt={
                      content
                        .storeSection
                        .image
                        .alt ||
                      content
                        .storeSection
                        .title
                    }
                  />
                ) : (
                  <div className="store-story__placeholder">
                    <Icon
                      name="store"
                      size={42}
                    />

                    <span>
                      Mağaza görseli
                    </span>
                  </div>
                )}

                <div className="store-story__visual-gradient" />

                <span className="store-story__label">
                  <span />

                  GERÇEK MAĞAZA
                </span>
              </div>

              <div className="store-story__content">
                <span className="eyebrow">
                  {
                    content
                      .storeSection
                      .eyebrow
                  }
                </span>

                <h2>
                  {
                    content
                      .storeSection
                      .title
                  }
                </h2>

                <p>
                  {
                    content
                      .storeSection
                      .description
                  }
                </p>

                <div className="store-story__details">
                  {content.storeSection.address && (
                    <div>
                      <Icon
                        name="map-pin"
                        size={21}
                      />

                      <span>
                        {
                          content
                            .storeSection
                            .address
                        }
                      </span>
                    </div>
                  )}

                  {content.storeSection.workingHoursText && (
                    <div>
                      <Icon
                        name="clock"
                        size={21}
                      />

                      <span>
                        {
                          content
                            .storeSection
                            .workingHoursText
                        }
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  className="button button--dark button--premium"
                  href={
                    content
                      .storeSection
                      .directionsButton
                      .href
                  }
                  target={
                    content
                      .storeSection
                      .directionsButton
                      .target
                  }
                >
                  {
                    content
                      .storeSection
                      .directionsButton
                      .label
                  }

                  <span className="button__icon">
                    <Icon
                      name="arrow-up-right"
                      size={18}
                    />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {content.finalCta.status ===
          "active" && (
          <section className="section">
            <div className="site-container">
              <div
                className="final-cta final-cta--premium"
                data-reveal
              >
                <div className="final-cta__glow" />

                <span className="eyebrow eyebrow--light">
                  {
                    content
                      .finalCta
                      .eyebrow
                  }
                </span>

                <h2>
                  {
                    content
                      .finalCta
                      .title
                  }
                </h2>

                <p>
                  {
                    content
                      .finalCta
                      .description
                  }
                </p>

                <div className="final-cta__actions">
                  <Link
                    className="button button--light button--premium"
                    href={
                      content
                        .finalCta
                        .primaryButton
                        .href
                    }
                    target={
                      content
                        .finalCta
                        .primaryButton
                        .target
                    }
                  >
                    {
                      content
                        .finalCta
                        .primaryButton
                        .label
                    }

                    <Icon
                      name="message-circle"
                      size={19}
                    />
                  </Link>

                  <Link
                    className="button button--outline-light"
                    href={
                      content
                        .finalCta
                        .secondaryButton
                        .href
                    }
                    target={
                      content
                        .finalCta
                        .secondaryButton
                        .target
                    }
                  >
                    {
                      content
                        .finalCta
                        .secondaryButton
                        .label
                    }
                  </Link>
                </div>

                <span className="final-cta__mark">
                  UB
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </SiteChrome>
  );
}