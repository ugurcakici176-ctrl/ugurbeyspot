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
import QuickQuoteModal from "@/components/site/quick-quote-modal";
import SellItemModal from "@/components/site/sell-item-modal";

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
  DEFAULT_HERO_IMAGES,
  DEFAULT_HOMEPAGE_CONTENT,
} from "@/lib/default-content";

import {
  getHomepageContent,
} from "@/lib/site-content";

import type {
  CampaignBanner,
  Category,
  HomepageContent,
  Product,
} from "@/lib/types";

const WHATSAPP_CATALOG_URL =
  "https://www.whatsapp.com/catalog/905520715689/?app_absent=0";

export interface HomeData {
  content: HomepageContent;
  categories: Category[];
  products: Product[];
  banners: CampaignBanner[];
}

export default function HomePageClient({
  initialData,
}: {
  initialData?: HomeData;
}) {
  const [
    data,
    setData,
  ] = useState<HomeData | null>(
    initialData || {
      content: DEFAULT_HOMEPAGE_CONTENT,
      categories: [],
      products: [],
      banners: [],
    },
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
  const [
    quoteOpen,
    setQuoteOpen,
  ] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  useEffect(() => {
    if (initialData) {
      const frameId = window.requestAnimationFrame(
        () => setPageReady(true),
      );

      return () => window.cancelAnimationFrame(frameId);
    }

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
  }, [initialData]);

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
    ...(content.hero.images.length > 0
      ? content.hero.images
      : DEFAULT_HERO_IMAGES),
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
          `home-experience ${pageReady
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
                    width={
                      heroImages[0].width ||
                      1536
                    }
                    height={
                      heroImages[0].height ||
                      1024
                    }
                    alt={
                      heroImages[0].alt ||
                      "Öne çıkan ürün"
                    }
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
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
                <span className="hero-pill__label">
                  Canli Destek
                </span>
                <strong>
                  Magaza ile aninda iletisim
                </strong>
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

        <section
          className="whatsapp-catalog"
          aria-labelledby="whatsapp-catalog-title"
        >
          <div className="site-container">
            <div
              className="whatsapp-catalog__card"
              data-reveal
            >
              <div className="whatsapp-catalog__content">
                <span className="whatsapp-catalog__eyebrow">
                  <span className="whatsapp-catalog__status" />
                  WHATSAPP KATALOĞU
                </span>

                <h2 id="whatsapp-catalog-title">
                  Güncel ürünleri
                  <span> WhatsApp&apos;ta keşfet.</span>
                </h2>

                <p>
                  Mağazadaki güncel ürün seçkisine göz at, beğendiğin
                  ürünün detaylarını ve stok durumunu bize hemen sor.
                </p>

                <div className="whatsapp-catalog__actions">
                  <a
                    className="button whatsapp-catalog__button"
                    href={WHATSAPP_CATALOG_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Uğur Bey Spot WhatsApp kataloğunu yeni sekmede aç"
                  >
                    <Icon
                      name="message-circle"
                      size={20}
                    />
                    Kataloğu Görüntüle
                    <Icon
                      name="arrow-up-right"
                      size={18}
                    />
                  </a>

                  <span className="whatsapp-catalog__note">
                    WhatsApp&apos;ta güvenli şekilde açılır
                  </span>
                </div>
              </div>

              <a
                className="whatsapp-catalog__preview"
                href={WHATSAPP_CATALOG_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp kataloğuna git"
              >
                <div className="whatsapp-catalog__phone-bar">
                  <span className="whatsapp-catalog__avatar">
                    UB
                  </span>

                  <span>
                    <strong>Uğur Bey Spot</strong>
                    <small>Ürün kataloğu</small>
                  </span>

                  <Icon
                    name="external-link"
                    size={18}
                  />
                </div>

                <div className="whatsapp-catalog__products">
                  {products
                    .slice(0, 3)
                    .map((product) => (
                      <article key={product.id}>
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span className="whatsapp-catalog__placeholder">
                            <Icon
                              name="package"
                              size={26}
                            />
                          </span>
                        )}

                        <strong>{product.title}</strong>
                        <small>
                          {product.categoryName ||
                            "Güncel ürün"}
                        </small>
                      </article>
                    ))}

                  {products.length === 0 &&
                    [
                      {
                        label: "Mobilya",
                        image:
                          "/images/whatsapp-catalog/mobilya.png",
                      },
                      {
                        label: "Beyaz Eşya",
                        image:
                          "/images/whatsapp-catalog/beyaz-esya.png",
                      },
                      {
                        label: "Elektronik",
                        image:
                          "/images/whatsapp-catalog/elektronik.png",
                      },
                    ].map((item) => (
                        <article key={item.label}>
                          <img
                            src={item.image}
                            alt={`${item.label} ürün seçkisi`}
                            loading="lazy"
                          />
                          <strong>{item.label}</strong>
                          <small>Ürünleri incele</small>
                        </article>
                      ),
                    )}
                </div>

                <span className="whatsapp-catalog__tap">
                  Kataloğa git
                  <Icon
                    name="arrow-right"
                    size={17}
                  />
                </span>
              </a>
            </div>
          </div>
        </section>

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
                        href={`/kategori/${category.slug}`}
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
        <section className="sell-home" aria-labelledby="sell-home-title">
          <div className="site-container">
            <div className="sell-home__card" data-reveal>
              <div className="sell-home__visual">
                <img src="/images/spot/ikinci-el-koltuk.jpg" alt="Satmak istediği koltuğun fotoğrafını çeken müşteri" />
                <div className="sell-home__photo-card sell-home__photo-card--one"><Icon name="image" size={18} /><span>Fotoğrafları yükle</span><strong>1–6 fotoğraf</strong></div>
                <div className="sell-home__photo-card sell-home__photo-card--two"><Icon name="check" size={18} /><span>Ücretsiz değerlendirme</span><strong>Hızlı geri dönüş</strong></div>
              </div>
              <div className="sell-home__content">
                <span className="eyebrow">EŞYAN MI VAR?</span>
                <h2 id="sell-home-title">Fotoğrafını gönder,<br /><em>değerini birlikte bulalım.</em></h2>
                <p>Kullanmadığın beyaz eşya, mobilya veya elektroniğin fotoğraflarını bize gönder. Uzman ekibimiz incelesin, sana hızlıca teklif versin.</p>
                <ol>
                  <li><span>01</span><div><strong>Fotoğrafları ekle</strong><small>Eşyayı farklı açılardan göster.</small></div></li>
                  <li><span>02</span><div><strong>Kısaca anlat</strong><small>Marka, model ve durumunu belirt.</small></div></li>
                  <li><span>03</span><div><strong>Teklifini al</strong><small>Ekibimiz seni telefonla arasın.</small></div></li>
                </ol>
                <button type="button" className="button button--dark sell-home__button" onClick={() => setSellOpen(true)}>Eşyam için teklif al <Icon name="arrow-right" /></button>
                <small className="sell-home__note"><Icon name="shield-check" size={15} /> Ücretsiz değerlendirme · Zorunluluk yok</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section quick-quote-home">
          <div className="site-container">
            <div
              className="quick-quote-home__card"
              data-reveal
            >
              <div className="quick-quote-home__glow quick-quote-home__glow--one" />
              <div className="quick-quote-home__glow quick-quote-home__glow--two" />

              <div className="quick-quote-home__content">
                <span className="eyebrow eyebrow--light">
                  HIZLI TEKLİF
                </span>

                <h2>
                  Aradığın ürünü seç,
                  <span>
                    tahmini fiyatını hemen öğren.
                  </span>
                </h2>

                <p>
                  Ürün tercihlerini ve ihtiyaçlarını birkaç adımda belirt.
                  Sistem sana saniyeler içinde ortalama bir fiyat aralığı
                  oluştursun. Kesin teklif için ekibimiz talebini ayrıca
                  inceleyip seninle iletişime geçsin.
                </p>

                <div className="quick-quote-home__features">
                  <div>
                    <Icon
                      name="sparkles"
                      size={20}
                    />

                    <span>
                      Akıllı fiyat tahmini
                    </span>
                  </div>

                  <div>
                    <Icon
                      name="clock"
                      size={20}
                    />

                    <span>
                      1 dakikada tamamla
                    </span>
                  </div>

                  <div>
                    <Icon
                      name="shield-check"
                      size={20}
                    />

                    <span>
                      Ücretsiz ve bağlayıcı değil
                    </span>
                  </div>
                </div>

                <div className="quick-quote-home__actions">
                  <button
                    type="button"
                    className="button button--light button--premium"
                    onClick={() =>
                      setQuoteOpen(true)
                    }
                  >
                    Hızlı Teklif Al

                    <span className="button__icon">
                      <Icon
                        name="arrow-right"
                        size={19}
                      />
                    </span>
                  </button>

                  <Link
                    href="/urunler"
                    className="button button--outline-light"
                  >
                    Önce Ürünleri İncele
                  </Link>
                </div>
              </div>

              <div className="quick-quote-home__visual">
                <div className="quick-quote-home__price-card">
                  <span>
                    TAHMİNİ FİYAT ARALIĞI
                  </span>

                  <strong>
                    ₺12.500
                    <small>
                      – ₺18.900
                    </small>
                  </strong>

                  <p>
                    Seçtiğin ürün, kondisyon ve teslimat tercihine göre
                    hesaplanır.
                  </p>

                  <div>
                    <span>
                      Ürün seçimi
                    </span>

                    <strong>
                      ✓
                    </strong>
                  </div>

                  <div>
                    <span>
                      İhtiyaç analizi
                    </span>

                    <strong>
                      ✓
                    </strong>
                  </div>

                  <div>
                    <span>
                      Ortalama teklif
                    </span>

                    <strong>
                      ✓
                    </strong>
                  </div>
                </div>

                <span className="quick-quote-home__badge">
                  <Icon
                    name="sparkles"
                    size={16}
                  />

                  Anında hesaplama
                </span>
              </div>
            </div>
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
                  {content.storeSection.image || DEFAULT_HERO_IMAGES[0] ? (
                    <img
                      src={
                        content.storeSection.image?.url ||
                        DEFAULT_HERO_IMAGES[0].url
                      }
                      alt={
                        content.storeSection.image?.alt ||
                        DEFAULT_HERO_IMAGES[0].alt ||
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
      <QuickQuoteModal

        open={quoteOpen}

        onClose={() => setQuoteOpen(false)}

        sourcePage="/"

      />
      <SellItemModal open={sellOpen} onClose={() => setSellOpen(false)} />
    </SiteChrome>
  );
}
