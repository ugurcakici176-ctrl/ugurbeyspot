"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import ProductCard from "@/components/products/product-card";
import SiteChrome from "@/components/site/site-chrome";
import EmptyState from "@/components/ui/empty-state";
import Icon from "@/components/ui/icon";
import { useCart } from "@/hooks/use-cart";
import LoadingScreen from "@/components/ui/loading-screen";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ROUTES } from "@/lib/constants";
import {
  getApprovedProductReviews,
  submitProductReview,
} from "@/lib/product-reviews";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import type { Product, ProductReview } from "@/lib/types";
import {
  buildTelUrl,
  buildWhatsappUrl,
  formatCurrency,
  formatDate,
  getDiscountPercent,
} from "@/lib/utils";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getProductBySlug(slug)
      .then(async (data) => {
        if (!active) return;

        setProduct(data);
        setReviewMessage(null);
        setReviewError(null);

        if (data) {
          const firstImage = [...data.images].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          )[0];

          setSelectedImageId(firstImage?.id || null);

          const related = await getRelatedProducts(data);
          const approvedReviews = await getApprovedProductReviews(data.id);

          if (active) setRelatedProducts(related);
          if (active) setReviews(approvedReviews);
        } else if (active) {
          setReviews([]);
        }
      })
      .catch((reason: unknown) => {
        console.error("Product could not be loaded:", reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const orderedImages = useMemo(
    () =>
      product
        ? [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [product],
  );

  const selectedImage =
    orderedImages.find((image) => image.id === selectedImageId) ||
    orderedImages[0];

  if (loading) {
    return <LoadingScreen label="Ürün hazırlanıyor" />;
  }

  if (!product) {
    return (
      <SiteChrome>
        <section className="page-shell">
          <div className="site-container">
            <EmptyState
              title="Ürün bulunamadı"
              description="Bu ürün kaldırılmış, pasife alınmış veya bağlantı değişmiş olabilir."
            />
            <div className="center-action">
              <Link className="button button--dark" href={ROUTES.products}>
                Ürünlere Dön
              </Link>
            </div>
          </div>
        </section>
      </SiteChrome>
    );
  }

  const discount = getDiscountPercent(
    product.price,
    product.compareAtPrice,
  );

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, item) => total + item.rating, 0) / reviews.length
      : 0;

  const whatsappHref = settings.contact.whatsapp
    ? buildWhatsappUrl(
        settings.contact.whatsapp,
        `Merhaba, ${product.title} ürünü hakkında bilgi almak istiyorum.`,
      )
    : ROUTES.contact;

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) {
      return;
    }

    if (reviewSubmitting) {
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage(null);
    setReviewError(null);

    try {
      await submitProductReview({
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        fullName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
        sourcePage: pathname || ROUTES.product(product.slug),
      });

      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      setReviewMessage("Yorumunuz başarıyla alındı. Onay sonrası yayına alınacaktır.");
    } catch (reason: unknown) {
      setReviewError(
        reason instanceof Error ? reason.message : "Yorum gönderilemedi.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function reloadReviews(): Promise<void> {
    if (!product) {
      return;
    }

    setReviewLoading(true);

    try {
      const approvedReviews = await getApprovedProductReviews(product.id);
      setReviews(approvedReviews);
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <SiteChrome>
      <section className="product-detail">
        <div className="site-container">
          <div className="breadcrumbs">
            <Link href="/">Ana Sayfa</Link>
            <span>/</span>
            <Link href={ROUTES.products}>Ürünler</Link>
            <span>/</span>
            <strong>{product.title}</strong>
          </div>

          <div className="product-detail__grid">
            <div className="product-gallery">
              <div className="product-gallery__main">
                {selectedImage ? (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.alt || product.title}
                  />
                ) : (
                  <span className="product-placeholder product-placeholder--large">
                    <Icon name="package" size={54} />
                  </span>
                )}

                <div className="product-gallery__badges">
                  {product.isNew && <span className="badge">Yeni</span>}
                  {discount > 0 && (
                    <span className="badge badge--accent">%{discount}</span>
                  )}
                </div>
              </div>

              {orderedImages.length > 1 && (
                <div className="product-gallery__thumbs">
                  {orderedImages.map((image) => (
                    <button
                      type="button"
                      key={image.id}
                      className={
                        selectedImage?.id === image.id ? "is-active" : ""
                      }
                      onClick={() => setSelectedImageId(image.id)}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || product.title}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail__content">
              <span className="product-detail__category">
                {product.categoryName || "Ürün"}
              </span>
              <h1>{product.title}</h1>
              <p className="product-detail__lead">
                {product.shortDescription}
              </p>

              <div className="product-detail__price">
                <strong>{formatCurrency(product.price)}</strong>
                {product.compareAtPrice &&
                  product.compareAtPrice > product.price && (
                    <del>{formatCurrency(product.compareAtPrice)}</del>
                  )}
              </div>

              <div className="stock-pill">
                <span />
                {product.stockStatus === "in_stock"
                  ? "Stokta"
                  : product.stockStatus === "low_stock"
                    ? "Son Ürünler"
                    : "Stokta Yok"}
              </div>

              <div className="product-detail__actions">
                <button
                  type="button"
                  className="button button--dark button--block"
                  disabled={
                    product.status === "sold_out" ||
                    product.stockStatus === "out_of_stock"
                  }
                  onClick={() => {
                    const firstImage = [...product.images].sort(
                      (a, b) => a.sortOrder - b.sortOrder,
                    )[0];

                    addItem({
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      price: product.price,
                      imageUrl: firstImage?.url,
                    });
                  }}
                >
                  <Icon name="shopping-bag" size={20} />
                  {product.status === "sold_out" ||
                  product.stockStatus === "out_of_stock"
                    ? "Stokta Yok"
                    : "Sepete Ekle"}
                </button>

                <a
                  className="button button--accent button--block"
                  href={whatsappHref}
                  target={settings.contact.whatsapp ? "_blank" : undefined}
                  rel={settings.contact.whatsapp ? "noreferrer" : undefined}
                >
                  <Icon name="message-circle" size={20} />
                  WhatsApp&apos;tan Bilgi Al
                </a>

                {settings.contact.phone && (
                  <a
                    className="button button--ghost button--block"
                    href={buildTelUrl(settings.contact.phone)}
                  >
                    <Icon name="phone" size={20} />
                    Hemen Ara
                  </a>
                )}
              </div>
            </div>
          </div>

          {(product.description || product.specifications.length > 0) && (
            <div className="product-information">
              {product.description && (
                <article className="product-information__description">
                  <span className="eyebrow">ÜRÜN DETAYI</span>
                  <h2>Ürün Hakkında</h2>
                  <p>{product.description}</p>
                </article>
              )}

              {product.specifications.length > 0 && (
                <article className="product-specifications">
                  <span className="eyebrow">ÖZELLİKLER</span>
                  <h2>Teknik Bilgiler</h2>
                  <dl>
                    {[...product.specifications]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((specification) => (
                        <div key={specification.id}>
                          <dt>{specification.name}</dt>
                          <dd>{specification.value}</dd>
                        </div>
                      ))}
                  </dl>
                </article>
              )}
            </div>
          )}

          <section className="product-reviews">
            <div className="section-heading section-heading--actions">
              <div>
                <span className="eyebrow">MUSTERI YORUMLARI</span>
                <h2>Bu Urun Hakkinda Yorumlar</h2>
              </div>
              <div className="product-reviews__summary">
                <strong>{reviews.length > 0 ? averageRating.toFixed(1) : "0.0"}</strong>
                <small>{reviews.length} onayli yorum</small>
              </div>
            </div>

            <div className="product-reviews__layout">
              <form className="product-review-form" onSubmit={handleReviewSubmit}>
                <label>
                  <span>Ad Soyad</span>
                  <input
                    required
                    value={reviewName}
                    onChange={(event) => setReviewName(event.target.value)}
                    placeholder="Adiniz soyadiniz"
                  />
                </label>

                <div className="product-review-form__rating">
                  <span>Puaniniz</span>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={reviewRating >= value ? "is-active" : ""}
                        onClick={() => setReviewRating(value)}
                        aria-label={`${value} puan`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span>Yorumunuz</span>
                  <textarea
                    required
                    rows={5}
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Urun deneyiminizi yazin"
                  />
                </label>

                {reviewMessage && (
                  <div className="form-alert form-alert--success">{reviewMessage}</div>
                )}

                {reviewError && (
                  <div className="form-alert form-alert--error">{reviewError}</div>
                )}

                <button type="submit" className="button button--dark" disabled={reviewSubmitting}>
                  {reviewSubmitting ? "Gonderiliyor..." : "Yorumu Gonder"}
                  <Icon name="arrow-right" size={17} />
                </button>
              </form>

              <div className="product-review-list">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => void reloadReviews()}
                >
                  Yorumlari Yenile
                  <Icon name="arrow-right" size={16} />
                </button>

                {reviewLoading && <div className="admin-empty">Yorumlar yukleniyor...</div>}

                {!reviewLoading && reviews.length === 0 && (
                  <div className="admin-empty">Henuz onayli yorum bulunmuyor.</div>
                )}

                {reviews.map((review) => (
                  <article key={review.id} className="product-review-card">
                    <div>
                      <strong>{review.fullName}</strong>
                      <small>{formatDate(review.createdAt)}</small>
                    </div>
                    <span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="related-products">
              <div className="section-heading section-heading--actions">
                <div>
                  <span className="eyebrow">BENZER ÜRÜNLER</span>
                  <h2>Bunlara da Göz Atın</h2>
                </div>
                <Link className="text-link" href={ROUTES.products}>
                  Tüm Ürünler
                  <Icon name="arrow-right" size={18} />
                </Link>
              </div>

              <div className="product-grid">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
