"use client";

import { type FormEvent, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-content";
import type { SiteSettings } from "@/lib/types";
import { deepClone } from "@/lib/utils";

export default function SettingsAdminClient() {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    deepClone(DEFAULT_SITE_SETTINGS),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getSiteSettings().then(setSettings);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await saveSiteSettings(settings);
      setMessage("Site ayarları başarıyla kaydedildi.");
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Ayarlar kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="AYARLAR"
        title="Site Ayarları"
        description="Marka, iletişim, mağaza ve duyuru bilgilerini yönetin."
      />

      <form className="admin-editor" onSubmit={handleSubmit}>
        {message && (
          <div className="admin-notice admin-notice--info">{message}</div>
        )}

        <div className="admin-settings-grid">
          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>01</span>
              <div>
                <h2>Marka Bilgileri</h2>
                <p>Sitenin temel marka kimliği.</p>
              </div>
            </div>

            <label className="admin-field">
              <span>Site Adı</span>
              <input
                value={settings.branding.siteName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      siteName: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Kısa Ad</span>
              <input
                value={settings.branding.shortName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      shortName: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Slogan</span>
              <input
                value={settings.branding.slogan}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      slogan: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </section>

          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>02</span>
              <div>
                <h2>İletişim</h2>
                <p>Müşterilerin ulaşacağı bilgiler.</p>
              </div>
            </div>

            {[
              ["phone", "Telefon"],
              ["whatsapp", "WhatsApp"],
              ["email", "E-posta"],
              ["address", "Açık Adres"],
              ["district", "İlçe"],
              ["city", "Şehir"],
              ["googleMapsUrl", "Google Maps URL"],
            ].map(([key, label]) => (
              <label className="admin-field" key={key}>
                <span>{label}</span>
                <input
                  value={String(
                    settings.contact[
                      key as
                        | "phone"
                        | "whatsapp"
                        | "email"
                        | "address"
                        | "district"
                        | "city"
                        | "googleMapsUrl"
                    ] || "",
                  )}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      contact: {
                        ...current.contact,
                        [key]: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
          </section>

          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>03</span>
              <div>
                <h2>Duyuru</h2>
                <p>Üst duyuru bandını yönetin.</p>
              </div>
            </div>

            <label className="admin-switch">
              <input
                type="checkbox"
                checked={settings.announcement.status === "active"}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    announcement: {
                      ...current.announcement,
                      status: event.target.checked ? "active" : "passive",
                    },
                  }))
                }
              />
              <span />
              <div>
                <strong>Duyuruyu Göster</strong>
                <small>Sitenin üst kısmında görünür.</small>
              </div>
            </label>

            <label className="admin-field">
              <span>Duyuru Metni</span>
              <input
                value={settings.announcement.text}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    announcement: {
                      ...current.announcement,
                      text: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Duyuru Linki</span>
              <input
                value={settings.announcement.href || ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    announcement: {
                      ...current.announcement,
                      href: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </section>

          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>04</span>
              <div>
                <h2>Footer</h2>
                <p>Alt alan metinlerini yönetin.</p>
              </div>
            </div>

            <label className="admin-field">
              <span>Footer Açıklaması</span>
              <textarea
                rows={4}
                value={settings.footer.description}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    footer: {
                      ...current.footer,
                      description: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Telif Metni</span>
              <input
                value={settings.footer.copyrightText}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    footer: {
                      ...current.footer,
                      copyrightText: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </section>
        </div>

        <div className="admin-sticky-save">
          <button
            type="submit"
            className="admin-primary-button admin-primary-button--large"
            disabled={saving}
          >
            <Icon name="save" size={19} />
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}
