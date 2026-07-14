"use client";

import { type FormEvent, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/default-content";
import { getHomepageContent, saveHomepageContent } from "@/lib/site-content";
import type { HomepageContent } from "@/lib/types";
import { deepClone } from "@/lib/utils";

export default function HomepageAdminClient() {
  const [content, setContent] = useState<HomepageContent>(() =>
    deepClone(DEFAULT_HOMEPAGE_CONTENT),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getHomepageContent().then(setContent);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await saveHomepageContent(content);
      setMessage("Ana sayfa başarıyla kaydedildi.");
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Ana sayfa kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="ANA SAYFA"
        title="Ana Sayfa Yönetimi"
        description="Hero, bölüm başlıkları, mağaza anlatımı ve final çağrı alanını düzenleyin."
      />

      <form className="admin-editor" onSubmit={handleSubmit}>
        {message && (
          <div className="admin-notice admin-notice--info">{message}</div>
        )}

        <section className="admin-panel admin-form-section">
          <div className="admin-form-section__heading">
            <span>01</span>
            <div>
              <h2>Hero Alanı</h2>
              <p>Sitenin ilk görünen premium karşılama alanı.</p>
            </div>
          </div>

          <label className="admin-field">
            <span>Üst Küçük Metin</span>
            <input
              value={content.hero.eyebrow}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  hero: { ...current.hero, eyebrow: event.target.value },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Ana Başlık</span>
            <input
              value={content.hero.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  hero: { ...current.hero, title: event.target.value },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Vurgulu Metin</span>
            <input
              value={content.hero.highlightedText}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    highlightedText: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Açıklama</span>
            <textarea
              rows={5}
              value={content.hero.description}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  hero: { ...current.hero, description: event.target.value },
                }))
              }
            />
          </label>
        </section>

        <section className="admin-panel admin-form-section">
          <div className="admin-form-section__heading">
            <span>02</span>
            <div>
              <h2>Bölüm Başlıkları</h2>
              <p>Kategoriler, ürünler ve neden biz alanları.</p>
            </div>
          </div>

          <label className="admin-field">
            <span>Kategoriler Başlığı</span>
            <input
              value={content.categoriesSection.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  categoriesSection: {
                    ...current.categoriesSection,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Öne Çıkan Ürünler Başlığı</span>
            <input
              value={content.featuredProductsSection.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  featuredProductsSection: {
                    ...current.featuredProductsSection,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Neden Biz Başlığı</span>
            <input
              value={content.whyUsSection.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  whyUsSection: {
                    ...current.whyUsSection,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>
        </section>

        <section className="admin-panel admin-form-section">
          <div className="admin-form-section__heading">
            <span>03</span>
            <div>
              <h2>Mağaza Alanı</h2>
              <p>Gerçek mağaza güvenini anlatan bölüm.</p>
            </div>
          </div>

          <label className="admin-field">
            <span>Başlık</span>
            <input
              value={content.storeSection.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  storeSection: {
                    ...current.storeSection,
                    title: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Açıklama</span>
            <textarea
              rows={5}
              value={content.storeSection.description}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  storeSection: {
                    ...current.storeSection,
                    description: event.target.value,
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
              <h2>Final CTA</h2>
              <p>Sayfa sonunda müşteriyi iletişime yönlendiren alan.</p>
            </div>
          </div>

          <label className="admin-field">
            <span>Başlık</span>
            <input
              value={content.finalCta.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  finalCta: { ...current.finalCta, title: event.target.value },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Açıklama</span>
            <textarea
              rows={4}
              value={content.finalCta.description}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  finalCta: {
                    ...current.finalCta,
                    description: event.target.value,
                  },
                }))
              }
            />
          </label>
        </section>

        <div className="admin-sticky-save">
          <button
            type="submit"
            className="admin-primary-button admin-primary-button--large"
            disabled={saving}
          >
            <Icon name="save" size={19} />
            {saving ? "Kaydediliyor..." : "Ana Sayfayı Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}
