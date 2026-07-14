"use client";

import { type FormEvent, useEffect, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  createCategory,
  deleteCategory,
  getCategories,
  isCategorySlugAvailable,
  updateCategory,
} from "@/lib/categories";
import { DEFAULT_SEO } from "@/lib/constants";
import type { Category, CategoryFormValues } from "@/lib/types";
import { slugify } from "@/lib/utils";

const EMPTY_FORM: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  sortOrder: 0,
  seo: {
    ...DEFAULT_SEO,
    title: "",
    description: "",
    keywords: [],
  },
};

export default function CategoriesAdminClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCategories() {
    setCategories(await getCategories({ includePassive: true }));
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  function editCategory(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      status: category.status,
      sortOrder: category.sortOrder,
      seo: category.seo,
    });
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const slug = slugify(form.slug || form.name);
    const available = await isCategorySlugAvailable(
      slug,
      editingId || undefined,
    );

    if (!available) {
      setMessage("Bu kategori bağlantısı kullanımda.");
      return;
    }

    if (editingId) {
      await updateCategory(editingId, { ...form, slug });
      setMessage("Kategori güncellendi.");
    } else {
      await createCategory({ ...form, slug });
      resetForm();
      setMessage("Kategori oluşturuldu.");
    }

    await loadCategories();
  }

  async function handleDelete(category: Category) {
    if (
      !window.confirm(
        `"${category.name}" kategorisini silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }

    await deleteCategory(category.id);
    await loadCategories();

    if (editingId === category.id) resetForm();
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="KATEGORİLER"
        title="Kategori Yönetimi"
        description="Ürün gruplarını, sıralamayı ve kategori SEO alanlarını yönetin."
      />

      <div className="admin-split-layout">
        <form className="admin-panel admin-form-section" onSubmit={handleSubmit}>
          <div className="admin-form-section__heading">
            <div>
              <span>{editingId ? "DÜZENLE" : "YENİ"}</span>
              <h2>{editingId ? "Kategori Düzenle" : "Yeni Kategori"}</h2>
            </div>
          </div>

          {message && (
            <div className="admin-notice admin-notice--info">{message}</div>
          )}

          <label className="admin-field">
            <span>Kategori Adı</span>
            <input
              required
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: editingId ? current.slug : slugify(name),
                }));
              }}
            />
          </label>

          <label className="admin-field">
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slug: slugify(event.target.value),
                }))
              }
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
            />
          </label>

          <label className="admin-field">
            <span>Sıra</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="admin-field">
            <span>Durum</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as CategoryFormValues["status"],
                }))
              }
            >
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </label>

          <div className="admin-form-actions">
            {editingId && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Vazgeç
              </button>
            )}
            <button className="admin-primary-button" type="submit">
              <Icon name="save" size={18} />
              Kaydet
            </button>
          </div>
        </form>

        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div>
              <span>LİSTE</span>
              <h2>Mevcut Kategoriler</h2>
            </div>
          </div>

          <div className="admin-category-list">
            {categories.map((category) => (
              <article key={category.id} className="admin-category-card">
                <span className="admin-category-card__image">
                  <Icon name="tag" size={21} />
                </span>
                <div>
                  <strong>{category.name}</strong>
                  <small>/{category.slug}</small>
                </div>
                <span className={`admin-status admin-status--${category.status}`}>
                  {category.status === "active" ? "Aktif" : "Pasif"}
                </span>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => editCategory(category)}>
                    <Icon name="edit" size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category)}
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
