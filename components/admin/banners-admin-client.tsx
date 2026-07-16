"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner,
} from "@/lib/banners";
import type {
  CampaignBanner,
  EntityStatus,
} from "@/lib/types";

interface BannerFormState {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  status: EntityStatus;
  sortOrder: number;
}

const EMPTY_FORM: BannerFormState = {
  title: "",
  description: "",
  buttonLabel: "Ürünleri İncele",
  buttonHref: "/urunler",
  status: "active",
  sortOrder: 0,
};

export default function BannersAdminClient() {
  const [banners, setBanners] = useState<CampaignBanner[]>([]);
  const [editing, setEditing] = useState<CampaignBanner | null>(null);
  const [form, setForm] = useState<BannerFormState>(() => ({
    ...EMPTY_FORM,
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadBanners = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const data = await getBanners(true);
      setBanners(data);
    } catch (error) {
      console.error("Bannerlar yüklenemedi:", error);
      setMessage("Bannerlar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBanners();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadBanners]);

  function reset(): void {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
    });
  }

  function editBanner(banner: CampaignBanner): void {
    setEditing(banner);

    setForm({
      title: banner.title,
      description: banner.description,
      buttonLabel: banner.button.label,
      buttonHref: banner.button.href,
      status: banner.status,
      sortOrder: banner.sortOrder,
    });

    setMessage(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        button: {
          label: form.buttonLabel.trim(),
          href: form.buttonHref.trim(),
          target: "_self" as const,
        },
        status: form.status,
        sortOrder: form.sortOrder,
      };

      if (!payload.title) {
        throw new Error("Banner başlığı zorunludur.");
      }

      if (editing) {
        await updateBanner(editing.id, payload);
        setMessage("Banner başarıyla güncellendi.");
      } else {
        await createBanner(payload);
        setMessage("Banner başarıyla oluşturuldu.");
      }

      reset();
      await loadBanners();
    } catch (error) {
      console.error("Banner kaydedilemedi:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Banner kaydedilirken bir hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    banner: CampaignBanner,
  ): Promise<void> {
    const confirmed = window.confirm(
      `"${banner.title}" bannerını silmek istediğinize emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBanner(banner.id);

      if (editing?.id === banner.id) {
        reset();
      }

      setMessage("Banner başarıyla silindi.");

      await loadBanners();
    } catch (error) {
      console.error("Banner silinemedi:", error);

      setMessage("Banner silinirken bir hata oluştu.");
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="BANNERLAR"
        title="Kampanya Bannerları"
        description="Ana sayfadaki kampanya alanlarının metin ve bağlantılarını yönetin."
      />

      <div className="admin-split-layout">
        <form
          className="admin-panel admin-form-section"
          onSubmit={handleSubmit}
        >
          <div className="admin-form-section__heading">
            <span>{editing ? "02" : "01"}</span>

            <div>
              <h2>
                {editing
                  ? "Banner Düzenle"
                  : "Yeni Banner"}
              </h2>

              <p>
                Kampanya başlığı, açıklaması ve yönlendirmesini
                düzenleyin.
              </p>
            </div>
          </div>

          {message && (
            <div className="admin-notice admin-notice--info">
              {message}
            </div>
          )}

          <label className="admin-field">
            <span>Başlık</span>

            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Kampanya başlığı"
            />
          </label>

          <label className="admin-field">
            <span>Açıklama</span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Kampanya açıklaması"
            />
          </label>

          <label className="admin-field">
            <span>Buton Yazısı</span>

            <input
              value={form.buttonLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  buttonLabel: event.target.value,
                }))
              }
              placeholder="Ürünleri İncele"
            />
          </label>

          <label className="admin-field">
            <span>Buton Linki</span>

            <input
              value={form.buttonHref}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  buttonHref: event.target.value,
                }))
              }
              placeholder="/urunler"
            />
          </label>

          <div className="admin-two-columns">
            <label className="admin-field">
              <span>Durum</span>

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as EntityStatus,
                  }))
                }
              >
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
              </select>
            </label>

            <label className="admin-field">
              <span>Sıra</span>

              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <div className="admin-form-actions">
            {editing && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={reset}
                disabled={saving}
              >
                Vazgeç
              </button>
            )}

            <button
              className="admin-primary-button"
              type="submit"
              disabled={saving}
            >
              <Icon name="save" size={18} />

              {saving
                ? "Kaydediliyor..."
                : editing
                  ? "Bannerı Güncelle"
                  : "Bannerı Kaydet"}
            </button>
          </div>
        </form>

        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span>MEVCUT</span>
              <h2>Banner Listesi</h2>
            </div>

            <strong>
              {banners.length}
            </strong>
          </div>

          {loading ? (
            <div className="admin-empty">
              Bannerlar yükleniyor...
            </div>
          ) : banners.length === 0 ? (
            <div className="admin-empty">
              Henüz banner bulunmuyor.
            </div>
          ) : (
            <div className="admin-category-list">
              {banners.map((banner) => (
                <article
                  className="admin-category-card"
                  key={banner.id}
                >
                  <span className="admin-category-card__image">
                    <Icon name="sparkles" size={21} />
                  </span>

                  <div>
                    <strong>{banner.title}</strong>
                    <small>{banner.description}</small>
                  </div>

                  <span
                    className={
                      `admin-status admin-status--${banner.status}`
                    }
                  >
                    {banner.status === "active"
                      ? "Aktif"
                      : "Pasif"}
                  </span>

                  <div className="admin-row-actions">
                    <button
                      type="button"
                      aria-label={`${banner.title} bannerını düzenle`}
                      onClick={() => editBanner(banner)}
                    >
                      <Icon name="edit" size={17} />
                    </button>

                    <button
                      type="button"
                      aria-label={`${banner.title} bannerını sil`}
                      onClick={() =>
                        void handleDelete(banner)
                      }
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}