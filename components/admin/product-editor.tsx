"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { KeywordsField } from "@/components/admin/admin-form-utils";
import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { getCategories } from "@/lib/categories";
import {
  DEFAULT_SEO,
  PRODUCT_LIMITS,
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
import { deleteImageAsset, uploadImage } from "@/lib/storage";
import type {
  Category,
  ImageAsset,
  Product,
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

const FLASH_MESSAGE_KEY = "ugurbey:product-editor-flash";

function writeFlashMessage(message: string): void {
  try {
    window.sessionStorage.setItem(FLASH_MESSAGE_KEY, message);
  } catch {
    // sessionStorage kullanılamıyorsa mesaj gösterilmeden devam edilir.
  }
}

function readFlashMessage(): string | null {
  try {
    const message = window.sessionStorage.getItem(FLASH_MESSAGE_KEY);
    window.sessionStorage.removeItem(FLASH_MESSAGE_KEY);
    return message;
  } catch {
    return null;
  }
}

function getErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

/** Eksik alanları (eski kayıtlar: seo/specifications yok vb.) varsayılanlarla doldurur. */
function productToFormValues(product: Product): ProductFormValues {
  const seo: Partial<ProductFormValues["seo"]> = product.seo ?? {};

  return {
    title: product.title ?? "",
    slug: product.slug ?? "",
    categoryId: product.categoryId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: typeof product.price === "number" ? product.price : 0,
    compareAtPrice: product.compareAtPrice || null,
    status: product.status ?? "active",
    stockStatus: product.stockStatus ?? "in_stock",
    featured: Boolean(product.featured),
    isNew: Boolean(product.isNew),
    images: Array.isArray(product.images) ? product.images : [],
    specifications: Array.isArray(product.specifications)
      ? product.specifications
      : [],
    seo: {
      ...EMPTY_VALUES.seo,
      ...seo,
      title: typeof seo.title === "string" ? seo.title : "",
      description: typeof seo.description === "string" ? seo.description : "",
      keywords: Array.isArray(seo.keywords) ? seo.keywords : [],
    },
  };
}

/**
 * Görselleri sırayla yükler. Bir yükleme başarısız olursa o ana kadar
 * yüklenenleri ve hatayı döndürür (yüklenenler kaybolmasın diye).
 */
async function uploadProductImages(
  files: File[],
  productId: string,
  alt: string,
  startIndex: number,
): Promise<{ uploaded: ImageAsset[]; error: unknown }> {
  const uploaded: ImageAsset[] = [];

  for (const [index, file] of files.entries()) {
    try {
      uploaded.push(
        await uploadImage(
          file,
          STORAGE_PATHS.product(productId),
          alt,
          startIndex + index,
        ),
      );
    } catch (error) {
      return { uploaded, error };
    }
  }

  return { uploaded, error: null };
}

function limitSeoText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function createProductSeo(
  title: string,
  categoryName: string,
  shortDescription: string,
  description: string,
): ProductFormValues["seo"] {
  const cleanTitle = title.trim();
  const cleanCategory = categoryName.trim();
  const titleParts = [
    cleanTitle,
    cleanCategory ? `Konya ${cleanCategory}` : "Konya İkinci El Eşya",
  ].filter(Boolean);

  const descriptionSource =
    shortDescription.trim() ||
    description.trim() ||
    `${cleanTitle || "Bu ürün"} hakkında fiyat, özellik ve güncel stok bilgilerini inceleyin.`;

  const keywordSource = [
    cleanTitle,
    cleanCategory,
    "Konya",
    "ikinci el",
    "spot",
    "Uğur Bey Spot",
  ];
  const keywords = Array.from(
    new Set(
      keywordSource
        .flatMap((item) => [item.trim(), ...item.trim().split(/\s+/)])
        .filter((item) => item.length > 2),
    ),
  ).slice(0, 12);

  return {
    ...DEFAULT_SEO,
    title: limitSeoText(titleParts.join(" | "), 60),
    description: limitSeoText(
      `${descriptionSource} Konya Uğur Bey Spot'ta güncel fiyat ve detayları keşfedin.`,
      155,
    ),
    keywords,
  };
}

export default function ProductEditor({
  productId,
}: {
  productId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(EMPTY_VALUES);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pendingImageDeletes, setPendingImageDeletes] = useState<ImageAsset[]>(
    [],
  );
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const seoTitleEdited = useRef(Boolean(productId));
  const seoDescriptionEdited = useRef(Boolean(productId));
  const seoKeywordsEdited = useRef(Boolean(productId));

  function withAutomaticSeo(
    current: ProductFormValues,
    changes: Partial<ProductFormValues>,
  ): ProductFormValues {
    const next = { ...current, ...changes };
    if (productId) return next;

    const categoryName =
      categories.find((item) => item.id === next.categoryId)?.name || "";
    const generated = createProductSeo(
      next.title,
      categoryName,
      next.shortDescription,
      next.description,
    );

    return {
      ...next,
      seo: {
        ...next.seo,
        title: seoTitleEdited.current ? next.seo.title : generated.title,
        description: seoDescriptionEdited.current
          ? next.seo.description
          : generated.description,
        keywords: seoKeywordsEdited.current
          ? next.seo.keywords
          : generated.keywords,
      },
    };
  }

  function regenerateSeo(): void {
    const categoryName =
      categories.find((item) => item.id === values.categoryId)?.name || "";
    seoTitleEdited.current = false;
    seoDescriptionEdited.current = false;
    seoKeywordsEdited.current = false;
    setValues((current) => ({
      ...current,
      seo: createProductSeo(
        current.title,
        categoryName,
        current.shortDescription,
        current.description,
      ),
    }));
  }

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
          setValues(productToFormValues(product));
        } else if (productId) {
          setNotFound(true);
        }

        const flash = readFlashMessage();
        if (flash) setMessage(flash);
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

  function removeImage(image: ImageAsset) {
    if (
      !window.confirm(
        "Bu görsel ürün kaydedildiğinde kalıcı olarak silinecek. Devam edilsin mi?",
      )
    ) {
      return;
    }

    // Dosya hemen silinmez; ürün başarıyla kaydedildikten sonra silinir.
    // Böylece kayıt başarısız olursa ürün kırık bir görsele işaret etmez.
    if (image.storagePath) {
      setPendingImageDeletes((current) => [...current, image]);
    }

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

  function handleFileSelection(files: FileList | null) {
    const selected = Array.from(files || []);
    if (selected.length === 0) return;

    const available =
      PRODUCT_LIMITS.maxImages - values.images.length - newFiles.length;

    if (available <= 0) {
      setMessage(
        `Bir üründe en fazla ${PRODUCT_LIMITS.maxImages} görsel olabilir.`,
      );
      return;
    }

    const accepted = selected.slice(0, available);

    setNewFiles((current) => [...current, ...accepted]);
    setMessage(
      accepted.length < selected.length
        ? `En fazla ${PRODUCT_LIMITS.maxImages} görsel eklenebilir; ${selected.length - accepted.length} görsel eklenmedi.`
        : null,
    );
  }

  async function flushPendingImageDeletes(): Promise<number> {
    if (pendingImageDeletes.length === 0) return 0;

    const results = await Promise.allSettled(
      pendingImageDeletes.map((image) => deleteImageAsset(image)),
    );

    setPendingImageDeletes([]);

    const failedCount = results.filter(
      (item) => item.status === "rejected",
    ).length;

    if (failedCount > 0) {
      console.warn("Some removed product images could not be deleted:", results);
    }

    return failedCount;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
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

      if (
        payload.images.length + newFiles.length >
        PRODUCT_LIMITS.maxImages
      ) {
        throw new Error(
          `Bir üründe en fazla ${PRODUCT_LIMITS.maxImages} görsel olabilir.`,
        );
      }

      if (productId) {
        const existingImages = payload.images.map((image, index) => ({
          ...image,
          sortOrder: index,
        }));

        const { uploaded, error: uploadError } =
          newFiles.length > 0
            ? await uploadProductImages(
                newFiles,
                productId,
                payload.title,
                existingImages.length,
              )
            : { uploaded: [], error: null };

        if (uploadError) {
          // Kısmen yüklenen dosyaları geri al; ürün kaydı değişmedi.
          await Promise.allSettled(
            uploaded.map((image) => deleteImageAsset(image)),
          );
          throw new Error(
            `Görseller yüklenemedi: ${getErrorMessage(uploadError, "bilinmeyen hata")}`,
          );
        }

        const images = [...existingImages, ...uploaded];

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

        const failedDeletes = await flushPendingImageDeletes();

        setMessage(
          failedDeletes > 0
            ? `Ürün güncellendi ancak ${failedDeletes} eski görsel depolamadan silinemedi.`
            : "Ürün başarıyla güncellendi.",
        );
      } else {
        const created = await createProduct({
          ...productPayload,
          images: [],
        });

        let flash = "Ürün oluşturuldu.";

        if (newFiles.length > 0) {
          const { uploaded, error: uploadError } = await uploadProductImages(
            newFiles,
            created.id,
            payload.title,
            0,
          );

          try {
            if (uploaded.length > 0) {
              await updateProduct(created.id, { images: uploaded });
            }
          } catch (reason: unknown) {
            console.error("Created product image update error:", reason);
            flash = `Ürün oluşturuldu ancak görseller ürüne eklenemedi: ${getErrorMessage(reason, "bilinmeyen hata")}`;
          }

          if (uploadError) {
            console.error("Created product image upload error:", uploadError);
            flash = `Ürün oluşturuldu ancak ${newFiles.length - uploaded.length} görsel yüklenemedi: ${getErrorMessage(uploadError, "bilinmeyen hata")}. Görselleri bu ekrandan tekrar ekleyebilirsiniz.`;
          }
        }

        // Ürün artık mevcut; "yeni ürün" ekranında kalıp tekrar kaydetmek
        // mükerrer ürün oluşturacağı için her durumda düzenleme ekranına geç.
        setNewFiles([]);
        writeFlashMessage(flash);
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

  if (notFound) {
    return (
      <>
        <AdminPageHeading
          eyebrow="ÜRÜN EDİTÖRÜ"
          title="Ürün bulunamadı"
          description="Bu ürün silinmiş veya bağlantı hatalı olabilir."
        />
        <div className="admin-panel admin-empty">
          Ürün bulunamadı.{" "}
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => router.push(ROUTES.adminProducts)}
          >
            Ürün listesine dön
          </button>
        </div>
      </>
    );
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
                    setValues((current) => withAutomaticSeo(current, {
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
                  onChange={(event) => updateField("slug", event.target.value)}
                  onBlur={() =>
                    setValues((current) => ({
                      ...current,
                      slug: slugify(current.slug),
                    }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Kategori</span>
                <select
                  required
                  value={values.categoryId}
                  onChange={(event) =>
                    setValues((current) =>
                      withAutomaticSeo(current, {
                        categoryId: event.target.value,
                      }),
                    )
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
                    setValues((current) =>
                      withAutomaticSeo(current, {
                        shortDescription: event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label className="admin-field">
                <span>Detaylı Açıklama</span>
                <textarea
                  rows={8}
                  value={values.description}
                  onChange={(event) =>
                    setValues((current) =>
                      withAutomaticSeo(current, {
                        description: event.target.value,
                      }),
                    )
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
                <span>
                  JPG, PNG, WebP veya AVIF — en fazla 10 MB, ürün başına en
                  fazla {PRODUCT_LIMITS.maxImages} görsel
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={saving}
                  onChange={(event) => {
                    handleFileSelection(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>

              {newFiles.length > 0 && (
                <p className="admin-upload-summary">
                  {newFiles.length} yeni görsel kaydedildiğinde yüklenecek.{" "}
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={saving}
                    onClick={() => setNewFiles([])}
                  >
                    Seçimi temizle
                  </button>
                </p>
              )}

              {pendingImageDeletes.length > 0 && (
                <p className="admin-upload-summary">
                  {pendingImageDeletes.length} görsel ürün kaydedildiğinde
                  silinecek.
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
                          aria-label="Görseli kaldır"
                          disabled={saving}
                          onClick={() => removeImage(image)}
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
                  <p>Ürün bilgilerine göre otomatik hazırlanır; isterseniz düzenleyebilirsiniz.</p>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={regenerateSeo}
                >
                  <Icon name="sparkles" size={17} />
                  SEO&apos;yu Yenile
                </button>
              </div>

              <label className="admin-field">
                <span>SEO Başlığı</span>
                <input
                  value={values.seo.title}
                  onChange={(event) => {
                    seoTitleEdited.current = true;
                    setValues((current) => ({
                      ...current,
                      seo: { ...current.seo, title: event.target.value },
                    }));
                  }}
                />
                <small>{values.seo.title.length}/60 karakter</small>
              </label>

              <label className="admin-field">
                <span>SEO Açıklaması</span>
                <textarea
                  rows={3}
                  value={values.seo.description}
                  onChange={(event) => {
                    seoDescriptionEdited.current = true;
                    setValues((current) => ({
                      ...current,
                      seo: {
                        ...current.seo,
                        description: event.target.value,
                      },
                    }));
                  }}
                />
                <small>{values.seo.description.length}/155 karakter</small>
              </label>

              <label className="admin-field">
                <span>Anahtar Kelimeler</span>
                <KeywordsField
                  value={values.seo.keywords}
                  placeholder="Virgülle ayırın: konya, ikinci el, spot"
                  onKeywordsChange={(keywords) => {
                    seoKeywordsEdited.current = true;
                    setValues((current) => ({
                      ...current,
                      seo: {
                        ...current.seo,
                        keywords,
                      },
                    }));
                  }}
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
