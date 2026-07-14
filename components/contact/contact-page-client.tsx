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

export default function ContactPageClient() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="site-container">
          <span className="eyebrow">İLETİŞİM</span>
          <h1>Size Nasıl Yardımcı Olabiliriz?</h1>
          <p>
            Ürünler hakkında bilgi almak veya mağazamıza ulaşmak için bize yazın.
          </p>
        </div>
      </section>

      <section className="section contact-section">
        <div className="site-container">
          <div className="contact-cards">
            <a
              className="contact-card"
              href={
                settings.contact.phone
                  ? buildTelUrl(settings.contact.phone)
                  : "#contact-form"
              }
            >
              <span><Icon name="phone" size={23} /></span>
              <small>TELEFON</small>
              <strong>{settings.contact.phone || "Yakında"}</strong>
            </a>

            <a
              className="contact-card"
              href={
                settings.contact.whatsapp
                  ? buildWhatsappUrl(settings.contact.whatsapp)
                  : "#contact-form"
              }
              target={settings.contact.whatsapp ? "_blank" : undefined}
              rel={settings.contact.whatsapp ? "noreferrer" : undefined}
            >
              <span><Icon name="message-circle" size={23} /></span>
              <small>WHATSAPP</small>
              <strong>Hızlıca Bilgi Alın</strong>
            </a>

            <a
              className="contact-card"
              href={
                settings.contact.email
                  ? `mailto:${settings.contact.email}`
                  : "#contact-form"
              }
            >
              <span><Icon name="mail" size={23} /></span>
              <small>E-POSTA</small>
              <strong>{settings.contact.email || "Yakında"}</strong>
            </a>

            <a
              className="contact-card"
              href={settings.contact.googleMapsUrl || "#contact-form"}
              target={settings.contact.googleMapsUrl ? "_blank" : undefined}
              rel={settings.contact.googleMapsUrl ? "noreferrer" : undefined}
            >
              <span><Icon name="map-pin" size={23} /></span>
              <small>MAĞAZA</small>
              <strong>
                {[settings.contact.district, settings.contact.city]
                  .filter(Boolean)
                  .join(", ") || "Yol Tarifi"}
              </strong>
            </a>
          </div>

          <div className="contact-layout">
            <div className="contact-form-panel" id="contact-form">
              <span className="eyebrow">BİZE YAZIN</span>
              <h2>Mesajınızı Bırakın</h2>
              <p>
                Formu doldurun. Mesajınız yönetim panelimize doğrudan ulaşsın.
              </p>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    <span>Ad Soyad</span>
                    <input
                      required
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
                    <span>Telefon</span>
                    <input
                      required
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
                    <span>Konu</span>
                    <input
                      required
                      value={form.subject}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                      placeholder="Nasıl yardımcı olabiliriz?"
                    />
                  </label>
                </div>

                <label>
                  <span>Mesajınız</span>
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
                  <div className="form-alert form-alert--error">{error}</div>
                )}

                {success && (
                  <div className="form-alert form-alert--success">
                    Mesajınız başarıyla gönderildi.
                  </div>
                )}

                <button
                  type="submit"
                  className="button button--dark"
                  disabled={sending}
                >
                  {sending ? "Gönderiliyor..." : "Mesajı Gönder"}
                  <Icon name="arrow-right" size={18} />
                </button>
              </form>
            </div>

            <aside className="contact-info-panel">
              <span className="eyebrow eyebrow--light">MAĞAZA</span>
              <h2>Bizi Ziyaret Edin</h2>
              <p>
                {settings.contact.address ||
                  "Mağaza adresi admin panelinden eklendiğinde burada görüntülenecek."}
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

              {settings.contact.googleMapsUrl && (
                <a
                  className="button button--light button--block"
                  href={settings.contact.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Yol Tarifi Al
                  <Icon name="arrow-up-right" size={18} />
                </a>
              )}
            </aside>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
