"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

import SiteChrome from "@/components/site/site-chrome";
import Icon from "@/components/ui/icon";

import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-settings";

import {
  buildCartWhatsappMessage,
} from "@/lib/cart";

import {
  ROUTES,
} from "@/lib/constants";

import {
  buildWhatsappUrl,
  formatCurrency,
} from "@/lib/utils";

export default function CartPageClient() {
  const { settings } =
    useSiteSettings();

  const {
    items,
    totalCount,
    totalPrice,
    updateItemQuantity,
    removeItem,
    clearAll,
  } = useCart();

  const [
    customerNote,
    setCustomerNote,
  ] = useState("");

  const whatsappMessage =
    useMemo(() => {
      const baseMessage =
        buildCartWhatsappMessage(
          items,
        );

      const cleanNote =
        customerNote.trim();

      if (!cleanNote) {
        return baseMessage;
      }

      return `${baseMessage}\n\nMüşteri Notu:\n${cleanNote}`;
    }, [
      customerNote,
      items,
    ]);

  const whatsappHref =
    buildWhatsappUrl(
      settings.contact.whatsapp,
      whatsappMessage,
    );

  const itemCountLabel =
    totalCount === 1
      ? "1 ürün"
      : `${totalCount} ürün`;

  function handleClearCart():
    void {
    if (
      !window.confirm(
        "Sepetteki tüm ürünleri kaldırmak istediğinize emin misiniz?",
      )
    ) {
      return;
    }

    clearAll();
    setCustomerNote("");
  }

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="site-container">
          <div className="cart-hero">
            <div>
              <span className="eyebrow">
                SEPET
              </span>

              <h1>
                Teklif Sepetiniz
              </h1>

              <p>
                İlgilendiğiniz ürünleri tek bir
                listede toplayın. Sepetinizi
                WhatsApp üzerinden mağaza
                ekibimize göndererek güncel stok,
                teslimat ve kesin fiyat bilgisini
                hızlıca öğrenin.
              </p>
            </div>

            <div className="cart-hero__stat">
              <span>
                Seçili Ürün
              </span>

              <strong>
                {totalCount}
              </strong>

              <small>
                Sepetinizde toplam{" "}
                {itemCountLabel} bulunuyor
              </small>
            </div>
          </div>

          <div className="cart-page__toolbar">
            <Link
              className="text-link"
              href={ROUTES.products}
            >
              <Icon
                name="arrow-right"
                size={18}
              />

              Ürünlere Dön
            </Link>

            {items.length > 0 && (
              <button
                type="button"
                className="cart-toolbar-clear"
                onClick={
                  handleClearCart
                }
              >
                <Icon
                  name="trash"
                  size={16}
                />

                Sepeti Temizle
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty__icon">
                <Icon
                  name="shopping-bag"
                  size={25}
                />
              </span>

              <span className="eyebrow">
                SEPETİNİZ BOŞ
              </span>

              <h2>
                Henüz ürün eklemediniz
              </h2>

              <p>
                İlgilendiğiniz ürünleri sepete
                ekleyerek mağazadan toplu fiyat ve
                stok bilgisi alabilirsiniz.
              </p>

              <div className="cart-empty__actions">
                <Link
                  className="button button--accent"
                  href={ROUTES.products}
                >
                  Ürünleri İncele

                  <Icon
                    name="arrow-right"
                    size={18}
                  />
                </Link>

                <Link
                  className="button button--ghost"
                  href={ROUTES.contact}
                >
                  Bize Ulaş

                  <Icon
                    name="message-circle"
                    size={18}
                  />
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                <div className="cart-list__heading">
                  <div>
                    <span className="eyebrow">
                      ÜRÜNLER
                    </span>

                    <h2>
                      Sepet İçeriği
                    </h2>
                  </div>

                  <span>
                    {itemCountLabel}
                  </span>
                </div>

                {items.map(
                  (item) => (
                    <article
                      key={
                        item.productId
                      }
                      className="cart-item"
                    >
                      <Link
                        href={ROUTES.product(
                          item.slug,
                        )}
                        className="cart-item__image"
                        aria-label={`${item.title} ürününü görüntüle`}
                      >
                        {item.imageUrl ? (
                          <img
                            src={
                              item.imageUrl
                            }
                            alt={
                              item.title
                            }
                          />
                        ) : (
                          <span>
                            <Icon
                              name="package"
                              size={22}
                            />
                          </span>
                        )}
                      </Link>

                      <div className="cart-item__content">
                        <div className="cart-item__title-row">
                          <Link
                            href={ROUTES.product(
                              item.slug,
                            )}
                          >
                            <strong>
                              {
                                item.title
                              }
                            </strong>
                          </Link>

                          <button
                            type="button"
                            className="cart-remove cart-remove--icon"
                            onClick={() =>
                              removeItem(
                                item.productId,
                              )
                            }
                            aria-label={`${item.title} ürününü sepetten kaldır`}
                            title="Sepetten kaldır"
                          >
                            <Icon
                              name="trash"
                              size={16}
                            />
                          </button>
                        </div>

                        <small className="cart-item__unit-price">
                          Birim fiyat:{" "}
                          {formatCurrency(
                            item.price,
                          )}
                        </small>

                        <div className="cart-item__actions">
                          <div
                            className="cart-qty"
                            aria-label="Ürün adedi"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  item.quantity -
                                    1,
                                )
                              }
                              aria-label="Adet azalt"
                            >
                              −
                            </button>

                            <span>
                              {
                                item.quantity
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateItemQuantity(
                                  item.productId,
                                  item.quantity +
                                    1,
                                )
                              }
                              aria-label="Adet artır"
                            >
                              +
                            </button>
                          </div>

                          <span className="cart-item__quantity-label">
                            {item.quantity} adet
                          </span>
                        </div>
                      </div>

                      <div className="cart-item__price">
                        <span>
                          Ara Toplam
                        </span>

                        <strong>
                          {formatCurrency(
                            item.price *
                              item.quantity,
                          )}
                        </strong>
                      </div>
                    </article>
                  ),
                )}
              </div>

              <aside className="cart-summary">
                <span className="eyebrow">
                  TEKLİF ÖZETİ
                </span>

                <h3>
                  WhatsApp ile Devam Edin
                </h3>

                <p>
                  Ürünleriniz, adet bilgileri ve
                  tahmini toplam otomatik olarak
                  WhatsApp mesajına eklenir.
                </p>

                <div className="cart-summary__stats">
                  <div>
                    <span>
                      Toplam Ürün
                    </span>

                    <strong>
                      {totalCount}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tahmini Toplam
                    </span>

                    <strong>
                      {formatCurrency(
                        totalPrice,
                      )}
                    </strong>
                  </div>
                </div>

                <label className="cart-summary__note">
                  <span>
                    Sipariş / Teklif Notu
                  </span>

                  <textarea
                    rows={4}
                    value={
                      customerNote
                    }
                    onChange={(
                      event,
                    ) =>
                      setCustomerNote(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Teslimat, marka tercihi, kurulum veya diğer taleplerinizi yazın..."
                  />

                  <small>
                    Bu not WhatsApp mesajına
                    otomatik eklenir.
                  </small>
                </label>

                <div className="cart-summary__notice">
                  <Icon
                    name="shield-check"
                    size={18}
                  />

                  <p>
                    Sepette gösterilen fiyatlar
                    tahminidir. Kesin fiyat ve stok
                    bilgisi mağaza onayıyla
                    netleşir.
                  </p>
                </div>

                {whatsappHref ? (
                  <a
                    className="button button--accent button--block"
                    href={
                      whatsappHref
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon
                      name="message-circle"
                      size={19}
                    />

                    WhatsApp ile Teklif Al

                    <Icon
                      name="arrow-up-right"
                      size={17}
                    />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="button button--ghost button--block"
                    disabled
                    title="Admin panelinden WhatsApp numarası ekleyin"
                  >
                    <Icon
                      name="message-circle"
                      size={19}
                    />

                    WhatsApp Numarası
                    Bekleniyor
                  </button>
                )}

                <Link
                  href={ROUTES.products}
                  className="button button--ghost button--block"
                >
                  Alışverişe Devam Et
                </Link>

                <div className="cart-summary__features">
                  <div>
                    <Icon
                      name="check"
                      size={15}
                    />

                    Ücretsiz teklif
                  </div>

                  <div>
                    <Icon
                      name="clock"
                      size={15}
                    />

                    Hızlı geri dönüş
                  </div>

                  <div>
                    <Icon
                      name="shield-check"
                      size={15}
                    />

                    Mağaza onaylı fiyat
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}