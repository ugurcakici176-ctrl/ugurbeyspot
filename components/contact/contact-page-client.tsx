"use client";

import { type FormEvent, useState } from "react";

import SiteChrome from "@/components/site/site-chrome";
import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { submitContactMessage } from "@/lib/messages";
import { buildTelUrl, buildWhatsappUrl } from "@/lib/utils";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

const STORE_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3149.348238125836!2d32.52562707647072!3d37.87553800634833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d08506c83815e5%3A0xe304d1d3ec04f9ab!2sU%C4%9Furbey%20Spot!5e0!3m2!1str!2str!4v1785171358810!5m2!1str!2str";

const STORE_MAP_DIRECTIONS_URL =
  "https://www.google.com/maps/search/?api=1&query=U%C4%9Furbey%20Spot";

export default function ContactPageClient() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = settings.contact.phone?.trim();
  const whatsapp = settings.contact.whatsapp?.trim();
  const email = settings.contact.email?.trim();
  const address = settings.contact.address?.trim();
  const mapsUrl =
    settings.contact.googleMapsUrl?.trim() ||
    STORE_MAP_DIRECTIONS_URL;
  const location =
    [settings.contact.district, settings.contact.city]
      .filter(Boolean)
      .join(", ") || "Konya";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setSuccess(false);
    setError(null);

    try {
      await submitContactMessage({
        ...form,
        sourcePage: "/iletisim",
      });

      setForm(INITIAL_FORM);
      setSuccess(true);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Mesaj gönderilemedi.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SiteChrome>
      <section className="page-hero page-hero--contact">
        <div className="contact-hero__glow contact-hero__glow--one" />
        <div className="contact-hero__glow contact-hero__glow--two" />

        <div className="site-container contact-hero">
          <div className="contact-hero__content">
            <span className="eyebrow eyebrow--light">BİZE ULAŞIN</span>
            <h1>
              Sorunuz varsa,
              <span> birlikte çözelim.</span>
            </h1>
            <p>
              Ürün, stok, fiyat, teslimat veya eşya satışı hakkında hızlıca
              bilgi alın. Size en uygun kanaldan ulaşabilirsiniz.
            </p>

            <div className="contact-hero__actions">
              {whatsapp ? (
                <a
                  className="button button--light"
                  href={buildWhatsappUrl(whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="message-circle" size={18} />
                  WhatsApp&apos;tan Yaz
                </a>
              ) : (
                <a className="button button--light" href="#contact-form">
                  Mesaj Gönder
                  <Icon name="arrow-right" size={18} />
                </a>
              )}

              <a className="contact-hero__text-link" href="#contact-map">
                Konumu Gör
                <Icon name="arrow-up-right" size={17} />
              </a>
            </div>
          </div>

          <aside className="contact-hero__card">
            <span className="contact-hero__card-label">UĞUR BEY SPOT</span>
            <strong>Mağazamız size bir mesaj kadar yakın.</strong>

            <div className="contact-hero__status">
              <span />
              Hızlı mağaza iletişimi
            </div>

            <div className="contact-hero__card-row">
              <Icon name="map-pin" size={19} />
              <div>
                <small>KONUM</small>
                <span>{location}</span>
              </div>
            </div>

            <div className="contact-hero__card-row">
              <Icon name="clock" size={19} />
              <div>
                <small>DESTEK</small>
                <span>Ürün ve mağaza bilgisi</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section contact-section">
        <div className="site-container">
          <header className="contact-section__heading">
            <div>
              <span className="eyebrow">İLETİŞİM KANALLARI</span>
              <h2>Size en uygun yolu seçin</h2>
            </div>
            <p>
              Hızlı bilgi için telefon veya WhatsApp&apos;ı, detaylı talepler
              için iletişim formunu kullanabilirsiniz.
            </p>
          </header>

          <div className="contact-cards">
            <a
              className="contact-card"
              href={
                phone
                  ? buildTelUrl(phone)
                  : "#contact-form"
              }
            >
              <div className="contact-card__top">
                <span><Icon name="phone" size={23} /></span>
                <Icon name="arrow-up-right" size={17} />
              </div>
              <small>HEMEN ARAYIN</small>
              <strong>{phone || "Mesaj bırakın"}</strong>
              <p>Ürün ve stok bilgisi için doğrudan görüşün.</p>
            </a>

            <a
              className="contact-card"
              href={
                whatsapp
                  ? buildWhatsappUrl(whatsapp)
                  : "#contact-form"
              }
              target={whatsapp ? "_blank" : undefined}
              rel={whatsapp ? "noreferrer" : undefined}
            >
              <div className="contact-card__top">
                <span><Icon name="message-circle" size={23} /></span>
                <Icon name="arrow-up-right" size={17} />
              </div>
              <small>WHATSAPP</small>
              <strong>Hızlıca Bilgi Alın</strong>
              <p>Fotoğraf gönderin, ürününüzü veya ihtiyacınızı anlatın.</p>
            </a>

            <a
              className="contact-card"
              href={
                email
                  ? `mailto:${email}`
                  : "#contact-form"
              }
            >
              <div className="contact-card__top">
                <span><Icon name="mail" size={23} /></span>
                <Icon name="arrow-up-right" size={17} />
              </div>
              <small>E-POSTA</small>
              <strong>{email || "Formu kullanın"}</strong>
              <p>Detaylı sorularınızı yazılı olarak iletin.</p>
            </a>

            <a
              className="contact-card"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <div className="contact-card__top">
                <span><Icon name="map-pin" size={23} /></span>
                <Icon name="arrow-up-right" size={17} />
              </div>
              <small>MAĞAZAMIZ</small>
              <strong>{location}</strong>
              <p>Google Maps üzerinden kolayca yol tarifi alın.</p>
            </a>
          </div>

          <div className="contact-layout">
            <div className="contact-form-panel" id="contact-form">
              <div className="contact-form-panel__heading">
                <div>
                  <span className="eyebrow">BİZE YAZIN</span>
                  <h2>Nasıl yardımcı olabiliriz?</h2>
                  <p>
                    Formu doldurun; talebiniz doğrudan mağaza ekibimize ulaşsın.
                  </p>
                </div>
                <span className="contact-form-panel__number">01</span>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Ad Soyad *</span>
                    <input
                      required
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      placeholder="Adınız ve soyadınız"
                    />
                  </label>

                  <label>
                    <span>Telefon *</span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="05xx xxx xx xx"
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label>
                    <span>E-posta</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="ornek@mail.com"
                    />
                  </label>

                  <label>
                    <span>Konu *</span>
                    <select
                      required
                      value={form.subject}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                    >
                      <option value="">Konu seçin</option>
                      <option value="Ürün bilgisi">Ürün bilgisi</option>
                      <option value="Eşya satışı">Eşya satışı</option>
                      <option value="Stok ve fiyat">Stok ve fiyat</option>
                      <option value="Teslimat">Teslimat</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Mesajınız *</span>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Mesajınızı yazın..."
                  />
                </label>

                {error && (
                  <div
                    className="form-alert form-alert--error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="form-alert form-alert--success"
                    role="status"
                  >
                    Mesajınız başarıyla gönderildi.
                  </div>
                )}

                <div className="contact-form__footer">
                  <p>
                    Bilgileriniz yalnızca talebinize dönüş yapmak için
                    kullanılır.
                  </p>
                  <button
                    type="submit"
                    className="button button--dark"
                    disabled={sending}
                  >
                    {sending ? "Gönderiliyor..." : "Mesajı Gönder"}
                    <Icon name="arrow-right" size={18} />
                  </button>
                </div>
              </form>
            </div>

            <aside className="contact-info-panel">
              <div className="contact-info-panel__mark">
                <Icon name="store" size={23} />
              </div>
              <span className="eyebrow eyebrow--light">MAĞAZA BİLGİSİ</span>
              <h2>Kapımız size açık.</h2>
              <p>
                {address ||
                  `${location} konumundaki mağazamıza gelmeden önce bizi arayarak güncel ürün ve stok bilgisini öğrenebilirsiniz.`}
              </p>

              {settings.contact.workingHours.length > 0 && (
                <div className="working-hours">
                  {[...settings.contact.workingHours]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => (
                      <div key={item.id}>
                        <span>{item.dayLabel}</span>
                        <strong>
                          {item.isClosed
                            ? "Kapalı"
                            : `${item.openingTime || "--:--"} - ${item.closingTime || "--:--"}`}
                        </strong>
                      </div>
                  ))}
                </div>
              )}

              {settings.contact.workingHours.length === 0 && (
                <div className="contact-info-panel__note">
                  <Icon name="clock" size={19} />
                  <span>
                    Ziyaret öncesinde çalışma saatlerini telefonla teyit
                    etmenizi öneririz.
                  </span>
                </div>
              )}

              <div className="contact-info-panel__actions">
                <a
                  className="button button--light button--block"
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Yol Tarifi Al
                  <Icon name="arrow-up-right" size={18} />
                </a>

                {phone && (
                  <a
                    className="contact-info-panel__phone"
                    href={buildTelUrl(phone)}
                  >
                    <Icon name="phone" size={17} />
                    {phone}
                  </a>
                )}
              </div>
            </aside>
          </div>

          <section
            className="contact-map"
            id="contact-map"
            aria-labelledby="contact-map-title"
          >
            <div className="contact-map__content">
              <span className="eyebrow">KONUMUMUZ</span>

              <h2 id="contact-map-title">
                Mağazamıza Kolayca Ulaşın
              </h2>

              <p>
                Uğur Bey Spot mağazamızı harita üzerinden inceleyin ve
                bulunduğunuz noktadan yol tarifi alın.
              </p>

              <div className="contact-map__details">
                <span>
                  <Icon name="map-pin" size={19} />
                  Konya
                </span>

                <span>
                  <Icon name="store" size={19} />
                  Uğur Bey Spot
                </span>
              </div>

              <a
                className="button button--dark"
                href={
                  mapsUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Google Maps&apos;te Aç
                <Icon name="arrow-up-right" size={18} />
              </a>
            </div>

            <div className="contact-map__frame">
              <iframe
                src={STORE_MAP_EMBED_URL}
                title="Uğur Bey Spot mağaza konumu"
                width="600"
                height="450"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />

              <span className="contact-map__badge">
                <Icon name="map-pin" size={16} />
                Uğur Bey Spot
              </span>
            </div>
          </section>
        </div>
      </section>
    </SiteChrome>
  );
}
