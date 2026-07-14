"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { getCategories } from "@/lib/categories";
import {
  DEFAULT_SEO,
  PRODUCT_STATUS_LABELS,
  ROUTES,
  STOCK_STATUS_LABELS,
  STORAGE_PATHS,
} from "@/lib/constants";
import {
  createProduct,
  getProductById,
  isProductSlugAvailable,
  updateProduct,
} from "@/lib/products";
import { deleteImageAsset, uploadImages } from "@/lib/storage";
import type {
  Category,
  ImageAsset,
  ProductFormValues,
} from "@/lib/types";
import { createId, slugify } from "@/lib/utils";

const EMPTY_VALUES: ProductFormValues = {
  title: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  status: "active",
  stockStatus: "in_stock",
  featured: false,
  isNew: true,
  images: [],
  specifications: [],
  seo: {
    ...DEFAULT_SEO,
    title: "",
    description: "",
    keywords: [],
  },
};

export default function ProductEditor({
  productId,
}: {
  productId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(EMPTY_VALUES);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getCategories({ includePassive: true }),
      productId ? getProductById(productId) : Promise.resolve(null),
    ])
      .then(([categoryData, product]) => {
        if (!active) return;

        setCategories(categoryData);

        if (product) {
          setValues({
            title: product.title,
            slug: product.slug,
            categoryId: product.categoryId,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice || null,
            status: product.status,
            stockStatus: product.stockStatus,
            featured: product.featured,
            isNew: product.isNew,
            images: product.images,
            specifications: product.specifications,
            seo: product.seo,
          });
        }
      })
      .catch((reason: unknown) => {
        console.error("Product editor load error:", reason);
        if (active) setMessage("Ürün bilgileri yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  function updateField<TKey extends keyof ProductFormValues>(
    key: TKey,
    value: ProductFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function removeImage(image: ImageAsset) {
    if (!window.confirm("Bu görseli silmek istiyor musunuz?")) return;

    await deleteImageAsset(image);

    setValues((current) => ({
      ...current,
      images: current.images
        .filter((item) => item.id !== image.id)
        .map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const slug = slugify(values.slug || values.title);

      if (!values.title.trim()) {
        throw new Error("Ürün adı zorunludur.");
      }

      if (!values.categoryId) {
        throw new Error("Kategori seçmelisiniz.");
      }

      const slugAvailable = await isProductSlugAvailable(
        slug,
        productId,
      );

      if (!slugAvailable) {
        throw new Error("Bu ürün bağlantısı başka bir üründe kullanılıyor.");
      }

      const selectedCategory = categories.find(
        (item) => item.id === values.categoryId,
      );

      const payload: ProductFormValues = {
        ...values,
        title: values.title.trim(),
        slug,
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        specifications: values.specifications
          .filter((item) => item.name.trim() && item.value.trim())
          .map((item, index) => ({
            ...item,
            name: item.name.trim(),
            value: item.value.trim(),
            sortOrder: index,
          })),
        seo: {
          ...values.seo,
          title: values.seo.title.trim() || values.title.trim(),
          description:
            values.seo.description.trim() ||
            values.shortDescription.trim(),
          keywords: values.seo.keywords
            .map((item) => item.trim())
            .filter(Boolean),
        },
      };

      const productPayload = {
        ...payload,
        categoryName: selectedCategory?.name,
      };

      if (productId) {
        let images = payload.images;

        if (newFiles.length > 0) {
          const uploaded = await uploadImages(
            newFiles,
            STORAGE_PATHS.product(productId),
            payload.title,
          );

          images = [
            ...images,
            ...uploaded.map((image, index) => ({
              ...image,
              sortOrder: images.length + index,
            })),
          ];
        }

        await updateProduct(productId, {
          ...productPayload,
          images,
        });

        setValues((current) => ({
          ...current,
          ...payload,
          images,
        }));
        setNewFiles([]);
        setMessage("Ürün başarıyla güncellendi.");
      } else {
        const created = await createProduct({
          ...productPayload,
          images: [],
        });

        if (newFiles.length > 0) {
          const images = await uploadImages(
            newFiles,
            STORAGE_PATHS.product(created.id),
            payload.title,
          );

          await updateProduct(created.id, { images });
        }

        router.replace(ROUTES.editProduct(created.id));
      }
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Ürün kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="admin-empty">Ürün bilgileri yükleniyor...</div>;
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="ÜRÜN EDİTÖRÜ"
        title={productId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
        description="Ürün bilgileri, fiyat, görseller, teknik özellikler ve SEO alanlarını yönetin."
      />

      <form className="admin-editor" onSubmit={handleSubmit}>
        {message && (
          <div className="admin-notice admin-notice--info">{message}</div>
        )}

        <div className="admin-editor__layout">
          <div className="admin-editor__main">
            <section className="admin-panel admin-form-section">
              <div className="admin-form-section__heading">
                <span>01</span>
                <div>
                  <h2>Temel Bilgiler</h2>
                  <p>Ürünün mağazada görünen ana içeriği.</p>
                </div>
              </div>

              <label className="admin-field">
                <span>Ürün Adı</span>
                <input
                  required
                  value={values.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setValues((current) => ({
                      ...current,
                      title,
                      slug: productId ? current.slug : slugify(title),
                    }));
                  }}
                  placeholder="Örn. Samsung 55 İnç Smart TV"
                />
              </label>

              <label className="admin-field">
                <span>Slug / Bağlantı</span>
                <input
                  value={values.slug}
                  onChange={(event) =>
                    updateField("slug", slugify(event.target.value))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Kategori</span>
                <select
                  required
                  value={values.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                >
                  <option value="">Kategori seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>Kısa Açıklama</span>
                <textarea
                  rows={3}
                  value={values.shortDescription}
                  onChange={(event) =>
                    updateField("shortDescription", event.target.value)
                  }
                />
              </label>

              <label className="admin-field">
                <span>Detaylı Açıklama</span>
                <textarea
                  rows={8}
                  value={values.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>
            </section>

            <section className="admin-panel admin-form-section">
              <div className="admin-form-section__heading">
                <span>02</span>
                <div>
                  <h2>Ürün Görselleri</h2>
                  <p>Çoklu görsel yükleyin ve mevcut görselleri yönetin.</p>
                </div>
              </div>

              <label className="admin-upload-zone">
                <Icon name="upload" size={26} />
                <strong>Görselleri Seçin</strong>
                <span>JPG, PNG, WebP veya AVIF — en fazla 10 MB</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) =>
                    setNewFiles(Array.from(event.target.files || []))
                  }
                />
              </label>

              {newFiles.length > 0 && (
                <p className="admin-upload-summary">
                  {newFiles.length} yeni görsel kaydedildiğinde yüklenecek.
                </p>
              )}

              {values.images.length > 0 && (
                <div className="admin-image-grid">
                  {[...values.images]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((image) => (
                      <div className="admin-image-card" key={image.id}>
                        <img
                          src={image.url}
                          alt={image.alt || values.title}
                        />
                        <button
                          type="button"
                          onClick={() => void removeImage(image)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="admin-panel admin-form-section">
              <div className="admin-form-section__heading">
                <span>03</span>
                <div>
                  <h2>Teknik Özellikler</h2>
                  <p>Her ürün için özellik satırları oluşturun.</p>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      specifications: [
                        ...current.specifications,
                        {
                          id: createId(),
                          name: "",
                          value: "",
                          sortOrder: current.specifications.length,
                        },
                      ],
                    }))
                  }
                >
                  <Icon name="plus" size={17} />
                  Özellik Ekle
                </button>
              </div>

              <div className="admin-spec-list">
                {values.specifications.map((specification) => (
                  <div className="admin-spec-row" key={specification.id}>
                    <input
                      value={specification.name}
                      placeholder="Özellik adı"
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          specifications: current.specifications.map((item) =>
                            item.id === specification.id
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                    <input
                      value={specification.value}
                      placeholder="Değer"
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          specifications: current.specifications.map((item) =>
                            item.id === specification.id
                              ? { ...item, value: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      aria-label="Özelliği sil"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          specifications: current.specifications.filter(
                            (item) => item.id !== specification.id,
                          ),
                        }))
                      }
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel admin-form-section">
              <div className="admin-form-section__heading">
                <span>04</span>
                <div>
                  <h2>SEO</h2>
                  <p>Google sonuçları için ürün meta alanları.</p>
                </div>
              </div>

              <label className="admin-field">
                <span>SEO Başlığı</span>
                <input
                  value={values.seo.title}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      seo: { ...current.seo, title: event.target.value },
                    }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>SEO Açıklaması</span>
                <textarea
                  rows={3}
                  value={values.seo.description}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      seo: {
                        ...current.seo,
                        description: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Anahtar Kelimeler</span>
                <input
                  value={values.seo.keywords.join(", ")}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      seo: {
                        ...current.seo,
                        keywords: event.target.value
                          .split(",")
                          .map((item) => item.trim()),
                      },
                    }))
                  }
                />
              </label>
            </section>
          </div>

          <aside className="admin-editor__side">
            <section className="admin-panel admin-form-section">
              <h2>Fiyatlandırma</h2>

              <label className="admin-field">
                <span>Satış Fiyatı</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.price}
                  onChange={(event) =>
                    updateField("price", Number(event.target.value))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Eski Fiyat</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.compareAtPrice ?? ""}
                  onChange={(event) =>
                    updateField(
                      "compareAtPrice",
                      event.target.value
                        ? Number(event.target.value)
                        : null,
                    )
                  }
                />
              </label>
            </section>

            <section className="admin-panel admin-form-section">
              <h2>Yayın Durumu</h2>

              <label className="admin-field">
                <span>Ürün Durumu</span>
                <select
                  value={values.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as ProductFormValues["status"],
                    )
                  }
                >
                  {Object.entries(PRODUCT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="admin-field">
                <span>Stok Durumu</span>
                <select
                  value={values.stockStatus}
                  onChange={(event) =>
                    updateField(
                      "stockStatus",
                      event.target.value as ProductFormValues["stockStatus"],
                    )
                  }
                >
                  {Object.entries(STOCK_STATUS_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={values.featured}
                  onChange={(event) =>
                    updateField("featured", event.target.checked)
                  }
                />
                <span />
                <div>
                  <strong>Öne Çıkan Ürün</strong>
                  <small>Ana sayfada göster.</small>
                </div>
              </label>

              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={values.isNew}
                  onChange={(event) =>
                    updateField("isNew", event.target.checked)
                  }
                />
                <span />
                <div>
                  <strong>Yeni Ürün Etiketi</strong>
                  <small>Kartta yeni etiketi göster.</small>
                </div>
              </label>
            </section>

            <button
              className="admin-primary-button admin-primary-button--large"
              type="submit"
              disabled={saving}
            >
              <Icon name="save" size={19} />
              {saving ? "Kaydediliyor..." : "Ürünü Kaydet"}
            </button>
          </aside>
        </div>
      </form>
    </>
  );
}
