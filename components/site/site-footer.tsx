import Link from "next/link";

import Icon from "@/components/ui/icon";
import { ROUTES } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";
import { buildTelUrl, buildWhatsappUrl } from "@/lib/utils";

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const legalLinks = settings.footer.legalLinks.filter(
    (item) => item.label.trim() && item.href.trim(),
  );

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="brand__mark brand__mark--light">UB</span>
            <h2>{settings.branding.siteName}</h2>
            <p>{settings.footer.description}</p>
          </div>

          <div className="site-footer__column">
            <span className="footer-label">{settings.footer.quickLinksTitle}</span>
            <Link href={ROUTES.home}>Ana Sayfa</Link>
            <Link href={ROUTES.about}>Hakkımızda</Link>
            <Link href={ROUTES.products}>Ürünler</Link>
            <Link href={ROUTES.contact}>İletişim</Link>
          </div>

          <div className="site-footer__column">
            <span className="footer-label">{settings.footer.contactTitle}</span>
            {settings.contact.phone && (
              <a href={buildTelUrl(settings.contact.phone)}>
                {settings.contact.phone}
              </a>
            )}
            {settings.contact.email && (
              <a href={`mailto:${settings.contact.email}`}>
                {settings.contact.email}
              </a>
            )}
            {settings.contact.whatsapp && (
              <a
                href={buildWhatsappUrl(settings.contact.whatsapp)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            )}
          </div>

          <div className="site-footer__column">
            <span className="footer-label">{settings.footer.storeTitle}</span>
            <p>
              {[settings.contact.district, settings.contact.city]
                .filter(Boolean)
                .join(", ") || "Adres bilgisi yakında"}
            </p>
            {settings.contact.googleMapsUrl && (
              <a
                className="footer-direction"
                href={settings.contact.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Yol Tarifi
                <Icon name="arrow-up-right" size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} {settings.footer.copyrightText}</p>
          <span>{settings.footer.bottomNote}</span>
          {legalLinks.length > 0 && (
            <div className="site-footer__legal-links">
              {legalLinks.map((item) => {
                const external = item.href.startsWith("http");

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
