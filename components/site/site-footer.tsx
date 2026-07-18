import Link from "next/link";

import Icon from "@/components/ui/icon";
import { BRAND_ASSETS } from "@/lib/branding";
import { ROUTES } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import {
  buildTelUrl,
  buildWhatsappUrl,
} from "@/lib/utils";

interface SiteFooterProps {
  settings: SiteSettings;
}

export default function SiteFooter({
  settings,
}: SiteFooterProps) {
  const year =
    new Date().getFullYear();

  const siteName =
    settings.branding.siteName ||
    "Uğur Bey Spot";

  const slogan =
    settings.branding.slogan ||
    "Doğru ürün, doğru fiyat.";

  const phone =
    settings.contact.phone?.trim() ||
    "";

  const whatsapp =
    settings.contact.whatsapp?.trim() ||
    "";

  const email =
    settings.contact.email?.trim() ||
    "";

  const googleMapsUrl =
    settings.contact.googleMapsUrl?.trim() ||
    "";

  const phoneUrl = phone
    ? buildTelUrl(phone)
    : "";

  const whatsappUrl = whatsapp
    ? buildWhatsappUrl(whatsapp)
    : "";

  const locationText =
    [
      settings.contact.district,
      settings.contact.city,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Mağaza konumu yakında";

  const legalLinks =
    settings.footer.legalLinks.filter(
      (item) =>
        item.label.trim() &&
        item.href.trim(),
    );

  const quickLinks = [
    {
      label: "Ana Sayfa",
      href: ROUTES.home,
    },
    {
      label: "Hakkımızda",
      href: ROUTES.about,
    },
    {
      label: "Ürünler",
      href: ROUTES.products,
    },
    {
      label: "İletişim",
      href: ROUTES.contact,
    },
  ];

  const trustItems = [
    {
      icon: "shield-check",
      title: "Güvenli Alışveriş",
      description:
        "Şeffaf ürün bilgisi ve kontrollü süreç.",
    },
    {
      icon: "message-circle",
      title: "Canlı Destek",
      description:
        "Sorularınız için hızlı mağaza iletişimi.",
    },
    {
      icon: "sparkles",
      title: "Seçkin Ürünler",
      description:
        "İhtiyaca uygun, özenle seçilmiş ürünler.",
    },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__glow site-footer__glow--one" />
      <div className="site-footer__glow site-footer__glow--two" />
      <div className="site-footer__grid-pattern" />

      <div className="site-container">
        <section className="site-footer__cta">
          <div className="site-footer__cta-content">
            <span className="footer-label footer-label--accent">
              HIZLI İLETİŞİM
            </span>

            <h2>
              Aradığınız ürünü birlikte
              <span> doğru fiyata bulalım.</span>
            </h2>

            <p>
              Ürün seçimi, stok bilgisi,
              teslimat ve fiyat konusunda
              mağaza ekibimiz size hızlıca
              yardımcı olsun.
            </p>
          </div>

          <div className="site-footer__cta-actions">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="site-footer__primary-action"
              >
                <Icon
                  name="message-circle"
                  size={19}
                />

                WhatsApp’tan Yaz

                <Icon
                  name="arrow-up-right"
                  size={17}
                />
              </a>
            )}

            {phoneUrl && (
              <a
                href={phoneUrl}
                className="site-footer__secondary-action"
              >
                <Icon
                  name="phone"
                  size={18}
                />

                Hemen Ara
              </a>
            )}
          </div>
        </section>

        <section className="site-footer__trust">
          {trustItems.map(
            (item, index) => (
              <article
                key={item.title}
                className="site-footer__trust-item"
                style={{
                  animationDelay:
                    `${index * 90}ms`,
                }}
              >
                <span>
                  <Icon
                    name={item.icon}
                    size={21}
                  />
                </span>

                <div>
                  <strong>
                    {item.title}
                  </strong>

                  <p>
                    {item.description}
                  </p>
                </div>
              </article>
            ),
          )}
        </section>

        <div className="site-footer__top">
          <section className="site-footer__brand">
            <span className="site-footer__brand-badge">
              PREMIUM SPOT SEÇKİSİ
            </span>

            <Link
              href="/"
              className="site-footer__brand-link"
              aria-label={`${siteName} ana sayfa`}
            >
              <span className="brand__mark brand__mark--light">
                <img
                  src={BRAND_ASSETS.mark}
                  alt=""
                  aria-hidden="true"
                />
              </span>

              <span className="site-footer__brand-copy">
                <strong>
                  {siteName}
                </strong>

                <small>
                  {slogan}
                </small>
              </span>
            </Link>

            <p className="site-footer__description">
              {settings.footer.description}
            </p>

            <div className="site-footer__chips">
              {phoneUrl && (
                <a
                  href={phoneUrl}
                  className="site-footer__chip"
                >
                  <Icon
                    name="phone"
                    size={15}
                  />

                  Hızlı Arama
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer__chip"
                >
                  <Icon
                    name="message-circle"
                    size={15}
                  />

                  WhatsApp Destek
                </a>
              )}

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer__chip"
                >
                  <Icon
                    name="map-pin"
                    size={15}
                  />

                  Mağaza Konumu
                </a>
              )}
            </div>
          </section>

          <nav
            className="site-footer__column"
            aria-label="Footer hızlı bağlantılar"
          >
            <span className="footer-label">
              {settings.footer
                .quickLinksTitle ||
                "Hızlı Bağlantılar"}
            </span>

            {quickLinks.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                >
                  <span>
                    {item.label}
                  </span>

                  <Icon
                    name="arrow-right"
                    size={14}
                  />
                </Link>
              ),
            )}
          </nav>

          <section className="site-footer__column">
            <span className="footer-label">
              {settings.footer
                .contactTitle ||
                "İletişim"}
            </span>

            {phoneUrl && (
              <a href={phoneUrl}>
                <span>
                  Telefon
                </span>

                <strong>
                  {phone}
                </strong>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
              >
                <span>
                  E-posta
                </span>

                <strong>
                  {email}
                </strong>
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  WhatsApp
                </span>

                <strong>
                  Mesaj Gönder
                </strong>
              </a>
            )}
          </section>

          <section className="site-footer__column">
            <span className="footer-label">
              {settings.footer
                .storeTitle ||
                "Mağazamız"}
            </span>

            <div className="site-footer__location">
              <Icon
                name="map-pin"
                size={18}
              />

              <p>
                {locationText}
              </p>
            </div>

            <div className="site-footer__hours">
              <Icon
                name="clock"
                size={18}
              />

              <div>
                <span>
                  Çalışma Saatleri
                </span>

                <strong>
                  Her gün 09:00 – 20:00
                </strong>
              </div>
            </div>

            {googleMapsUrl && (
              <a
                className="footer-direction"
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Yol Tarifi Al

                <Icon
                  name="arrow-up-right"
                  size={16}
                />
              </a>
            )}
          </section>
        </div>

        <div className="site-footer__divider" />

        <div className="site-footer__bottom">
          <div className="site-footer__copyright">
            <p>
              © {year}{" "}
              {settings.footer
                .copyrightText ||
                siteName}
            </p>

            <span>
              {settings.footer
                .bottomNote ||
                "Tüm hakları saklıdır."}
            </span>
          </div>

          {legalLinks.length > 0 && (
            <nav
              className="site-footer__legal-links"
              aria-label="Yasal bağlantılar"
            >
              {legalLinks.map(
                (item) => {
                  const external =
                    item.href.startsWith(
                      "http",
                    );

                  if (external) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                },
              )}
            </nav>
          )}

          <a
            href="#top"
            className="site-footer__back-to-top"
            aria-label="Sayfanın üstüne dön"
          >
            <Icon
              name="arrow-up-right"
              size={16}
            />

            Yukarı Çık
          </a>
        </div>
      </div>
    </footer>
  );
}
