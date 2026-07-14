"use client";

import { type FormEvent, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-content";
import type { SeoConfig, SiteSettings } from "@/lib/types";
import { deepClone } from "@/lib/utils";

type SeoKey =
  | "homepageSeo"
  | "aboutSeo"
  | "productsSeo"
  | "contactSeo";

const PAGE_LABELS: Record<SeoKey, string> = {
  homepageSeo: "Ana Sayfa",
  aboutSeo: "Hakkımızda",
  productsSeo: "Ürünler",
  contactSeo: "İletişim",
};

export default function SeoAdminClient() {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    deepClone(DEFAULT_SITE_SETTINGS),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getSiteSettings().then(setSettings);
  }, []);

  function updateSeo(
    key: SeoKey,
    field: keyof SeoConfig,
    value: string | string[] | boolean,
  ) {
    setSettings((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [key]: {
          ...current.seo[key],
          [field]: value,
        },
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await saveSiteSettings(settings);
      setMessage("SEO ayarları başarıyla kaydedildi.");
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "SEO ayarları kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="SEO"
        title="Arama Motoru Ayarları"
        description="Sayfa başlıklarını, açıklamaları ve anahtar kelimeleri yönetin."
      />

      <form className="admin-editor" onSubmit={handleSubmit}>
        {message && (
          <div className="admin-notice admin-notice--info">{message}</div>
        )}

        <div className="admin-seo-grid">
          {(Object.keys(PAGE_LABELS) as SeoKey[]).map((key) => (
            <section className="admin-panel admin-form-section" key={key}>
              <div className="admin-form-section__heading">
                <div>
                  <span>SAYFA SEO</span>
                  <h2>{PAGE_LABELS[key]}</h2>
                </div>
              </div>

              <label className="admin-field">
                <span>SEO Başlığı</span>
                <input
                  value={settings.seo[key].title}
                  onChange={(event) =>
                    updateSeo(key, "title", event.target.value)
                  }
                />
              </label>

              <label className="admin-field">
                <span>Meta Açıklaması</span>
                <textarea
                  rows={4}
                  value={settings.seo[key].description}
                  onChange={(event) =>
                    updateSeo(key, "description", event.target.value)
                  }
                />
              </label>

              <label className="admin-field">
                <span>Anahtar Kelimeler</span>
                <input
                  value={settings.seo[key].keywords.join(", ")}
                  onChange={(event) =>
                    updateSeo(
                      key,
                      "keywords",
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </label>
            </section>
          ))}
        </div>

        <div className="admin-sticky-save">
          <button
            type="submit"
            className="admin-primary-button admin-primary-button--large"
            disabled={saving}
          >
            <Icon name="save" size={19} />
            {saving ? "Kaydediliyor..." : "SEO Ayarlarını Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}
