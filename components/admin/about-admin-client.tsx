"use client";

import { type FormEvent, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/default-content";
import { getAboutContent, saveAboutContent } from "@/lib/site-content";
import type { AboutContent } from "@/lib/types";
import { deepClone } from "@/lib/utils";

export default function AboutAdminClient() {
  const [content, setContent] = useState<AboutContent>(() =>
    deepClone(DEFAULT_ABOUT_CONTENT),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getAboutContent().then(setContent);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await saveAboutContent(content);
      setMessage("Hakkımızda sayfası başarıyla kaydedildi.");
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "İçerik kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="HAKKIMIZDA"
        title="Hakkımızda Yönetimi"
        description="Marka hikâyesini, değerleri ve kurumsal anlatımı yönetin."
      />

      <form className="admin-editor" onSubmit={handleSubmit}>
        {message && (
          <div className="admin-notice admin-notice--info">{message}</div>
        )}

        <section className="admin-panel admin-form-section">
          <div className="admin-form-section__heading">
            <span>01</span>
            <div><h2>Hero</h2><p>İlk karşılama alanı.</p></div>
          </div>

          <label className="admin-field">
            <span>Başlık</span>
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
            <div><h2>Hikâye</h2><p>Kurumsal anlatım ve marka geçmişi.</p></div>
          </div>

          <label className="admin-field">
            <span>Başlık</span>
            <input
              value={content.story.title}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  story: { ...current.story, title: event.target.value },
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Paragraflar</span>
            <textarea
              rows={10}
              value={content.story.paragraphs.join("\n\n")}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  story: {
                    ...current.story,
                    paragraphs: event.target.value
                      .split(/\n\s*\n/)
                      .map((item) => item.trim())
                      .filter(Boolean),
                  },
                }))
              }
              placeholder="Paragrafları boş satırla ayırın."
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
            {saving ? "Kaydediliyor..." : "Hakkımızda Sayfasını Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}
