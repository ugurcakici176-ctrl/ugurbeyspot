"use client";

import Link from "next/link";

import SiteChrome from "@/components/site/site-chrome";
import Icon from "@/components/ui/icon";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { buildCartWhatsappMessage } from "@/lib/cart";
import { ROUTES } from "@/lib/constants";
import { buildWhatsappUrl, formatCurrency } from "@/lib/utils";

export default function CartPageClient() {
  const { settings } = useSiteSettings();
  const {
    items,
    totalCount,
    totalPrice,
    updateItemQuantity,
    removeItem,
    clearAll,
  } = useCart();

  const whatsappHref = settings.contact.whatsapp
    ? buildWhatsappUrl(
        settings.contact.whatsapp,
        buildCartWhatsappMessage(items),
      )
    : ROUTES.contact;

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="site-container">
          <div className="cart-hero">
            <div>
              <span className="eyebrow">SEPET</span>
              <h1>Teklif Sepetiniz</h1>
              <p>
                Kurumsal teklif akisinizi hizlandirmak icin urunleri burada toplayin,
                tek tikla WhatsApp&apos;a aktarip sureci tamamlayin.
              </p>
            </div>

            <div className="cart-hero__stat">
              <span>Toplam Urun</span>
              <strong>{totalCount}</strong>
              <small>Sepetteki secili urun adedi</small>
            </div>
          </div>

          <div className="cart-page__toolbar">
            <Link className="text-link" href={ROUTES.products}>
              Urunlere Don
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty__icon">
                <Icon name="shopping-bag" size={24} />
              </span>

              <h2>Sepetiniz su an bos</h2>
              <p>Urun ekleyip teklifinizi WhatsApp uzerinden aninda iletebilirsiniz.</p>

              <Link className="button button--accent" href={ROUTES.products}>
                Urunleri Incele
                <Icon name="arrow-right" size={18} />
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {items.map((item) => (
                  <article key={item.productId} className="cart-item">
                    <Link href={ROUTES.product(item.slug)} className="cart-item__image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} />
                      ) : (
                        <span>
                          <Icon name="package" size={20} />
                        </span>
                      )}
                    </Link>

                    <div className="cart-item__content">
                      <Link href={ROUTES.product(item.slug)}>
                        <strong>{item.title}</strong>
                      </Link>
                      <small>{formatCurrency(item.price)}</small>

                      <div className="cart-item__actions">
                        <div className="cart-qty">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                            aria-label="Adet azalt"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            aria-label="Adet artir"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeItem(item.productId)}
                        >
                          Kaldir
                        </button>
                      </div>
                    </div>

                    <strong className="cart-item__total">
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </article>
                ))}
              </div>

              <aside className="cart-summary">
                <span className="eyebrow">OZET</span>
                <h3>WhatsApp ile Devam Et</h3>
                <p>
                  Sepetinizdeki urunler mesaj metnine otomatik eklenir. Ekibimiz stok ve fiyat bilgisini hizlica iletir.
                </p>

                <div className="cart-summary__stats">
                  <div>
                    <span>Toplam Urun</span>
                    <strong>{totalCount}</strong>
                  </div>
                  <div>
                    <span>Genel Toplam</span>
                    <strong>{formatCurrency(totalPrice)}</strong>
                  </div>
                </div>

                <a
                  className="button button--accent button--block"
                  href={whatsappHref}
                  target={settings.contact.whatsapp ? "_blank" : undefined}
                  rel={settings.contact.whatsapp ? "noreferrer" : undefined}
                >
                  <Icon name="message-circle" size={19} />
                  WhatsApp ile Devam Et
                </a>

                <button type="button" className="button button--ghost button--block" onClick={clearAll}>
                  Sepeti Temizle
                </button>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
