"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/default-content";
import { getAboutContent, saveAboutContent } from "@/lib/site-content";
import type { AboutContent } from "@/lib/types";
import { deepClone } from "@/lib/utils";

type NoticeType = "success" | "error" | "info";

type NoticeState = {
  type: NoticeType;
  text: string;
};

type ValueItem = AboutContent["values"]["items"][number];
type StatisticItem = AboutContent["statistics"]["items"][number];
type GalleryImage = AboutContent["gallery"]["images"][number];
type AboutImageAsset = NonNullable<AboutContent["hero"]["image"]>;

function createEmptyImageAsset(prefix: string): AboutImageAsset {
  return {
    id: createId(prefix),
    url: "",
    alt: "",
    storagePath: "",
    sortOrder: 0,
  };
}
type SectionHeadingProps = {
  number: string;
  title: string;
  description: string;
  children?: ReactNode;
};

type ImagePreviewProps = {
  url?: string;
  alt?: string;
  emptyText?: string;
};

function createId(prefix: string) {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto?.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeSortOrders<T extends { sortOrder: number }>(items: T[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

function serializeContent(content: AboutContent) {
  return JSON.stringify(content);
}

function SectionHeading({
  number,
  title,
  description,
  children,
}: SectionHeadingProps) {
  return (
    <div className="admin-form-section__heading">
      <span>{number}</span>

      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {children && (
        <div className="admin-form-section__actions">{children}</div>
      )}
    </div>
  );
}

function ImagePreview({
  url,
  alt,
  emptyText = "Görsel URL’si girildiğinde önizleme burada görünür.",
}: ImagePreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

 useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setFailedUrl(null);
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [url]);

  const normalizedUrl = url?.trim() ?? "";
  const hasValidPreview = normalizedUrl && failedUrl !== normalizedUrl;

  return (
    <div className="admin-image-preview">
      {hasValidPreview ? (
        <img
          src={normalizedUrl}
          alt={alt?.trim() || "Görsel önizlemesi"}
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(normalizedUrl)}
        />
      ) : (
        <div className="admin-image-preview__empty">
          <Icon name="image" size={28} />

          <span>
            {normalizedUrl && failedUrl === normalizedUrl
              ? "Görsel yüklenemedi. URL adresini kontrol edin."
              : emptyText}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AboutAdminClient() {
  const defaultContent = useMemo(
    () => deepClone(DEFAULT_ABOUT_CONTENT),
    [],
  );

  const [content, setContent] = useState<AboutContent>(() =>
    deepClone(DEFAULT_ABOUT_CONTENT),
  );

  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeContent(deepClone(DEFAULT_ABOUT_CONTENT)),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const currentSnapshot = useMemo(
    () => serializeContent(content),
    [content],
  );

  const isDirty = currentSnapshot !== savedSnapshot;

  const sortedValues = useMemo(
    () =>
      [...content.values.items].sort(
        (first, second) => first.sortOrder - second.sortOrder,
      ),
    [content.values.items],
  );

  const sortedStatistics = useMemo(
    () =>
      [...content.statistics.items].sort(
        (first, second) => first.sortOrder - second.sortOrder,
      ),
    [content.statistics.items],
  );

  const sortedGalleryImages = useMemo(
    () =>
      [...content.gallery.images].sort(
        (first, second) => first.sortOrder - second.sortOrder,
      ),
    [content.gallery.images],
  );

  const showNotice = useCallback(
    (type: NoticeType, text: string, autoClose = true) => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }

      setNotice({ type, text });

      if (autoClose) {
        noticeTimeoutRef.current = setTimeout(() => {
          setNotice(null);
        }, 5000);
      }
    },
    [],
  );

 const loadContent = useCallback(
  async (options?: {
    askBeforeDiscard?: boolean;
    currentlyDirty?: boolean;
  }) => {
    if (
      options?.askBeforeDiscard &&
      options.currentlyDirty &&
      !window.confirm(
        "Kaydedilmemiş değişiklikleriniz silinecek. İçeriği yeniden yüklemek istiyor musunuz?",
      )
    ) {
      return;
    }
      setLoading(true);
      setNotice(null);

      try {
        const loadedContent = await getAboutContent();
        const clonedContent = deepClone(loadedContent);
        const snapshot = serializeContent(clonedContent);

        setContent(clonedContent);
        setSavedSnapshot(snapshot);

        if (options?.askBeforeDiscard) {
          showNotice(
            "success",
            "Hakkımızda içeriği sunucudan yeniden yüklendi.",
          );
        }
      } catch (reason: unknown) {
        console.error("About content could not be loaded:", reason);

        showNotice(
          "error",
          reason instanceof Error
            ? reason.message
            : "Hakkımızda içeriği yüklenemedi.",
          false,
        );
      } finally {
        setLoading(false);
      }
    },
    [showNotice],
  );

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    void loadContent();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadContent]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty || saving) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, saving]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  function validateContent() {
    const errors: string[] = [];

    if (!content.hero.title.trim()) {
      errors.push("Hero başlığı boş bırakılamaz.");
    }

    if (!content.hero.description.trim()) {
      errors.push("Hero açıklaması boş bırakılamaz.");
    }

    if (!content.story.title.trim()) {
      errors.push("Hikâye başlığı boş bırakılamaz.");
    }

    if (
      content.story.paragraphs.length === 0 ||
      content.story.paragraphs.every(
        (paragraph) => !paragraph.trim(),
      )
    ) {
      errors.push("En az bir hikâye paragrafı eklenmelidir.");
    }

    content.values.items.forEach((item, index) => {
      if (!item.title.trim()) {
        errors.push(`${index + 1}. değer kartının başlığı boş.`);
      }

      if (!item.description.trim()) {
        errors.push(`${index + 1}. değer kartının açıklaması boş.`);
      }
    });

    content.statistics.items.forEach((item, index) => {
      if (!item.label.trim()) {
        errors.push(`${index + 1}. istatistiğin etiketi boş.`);
      }

      if (!Number.isFinite(Number(item.value))) {
        errors.push(`${index + 1}. istatistiğin değeri geçersiz.`);
      }
    });

    content.gallery.images.forEach((image, index) => {
      if (!image.url.trim()) {
        errors.push(`${index + 1}. galeri görselinin URL adresi boş.`);
      }
    });

    return errors;
  }

function prepareContentForSave(): AboutContent {
  const heroImage = content.hero.image?.url.trim()
    ? {
        ...content.hero.image,
        url: content.hero.image.url.trim(),
        alt: content.hero.image.alt.trim(),
        storagePath: content.hero.image.storagePath ?? "",
        sortOrder: content.hero.image.sortOrder ?? 0,
      }
    : undefined;

  const storyImage = content.story.image?.url.trim()
    ? {
        ...content.story.image,
        url: content.story.image.url.trim(),
        alt: content.story.image.alt.trim(),
        storagePath: content.story.image.storagePath ?? "",
        sortOrder: content.story.image.sortOrder ?? 0,
      }
    : undefined;

  return {
    ...content,

    hero: {
      ...content.hero,
      eyebrow: content.hero.eyebrow.trim(),
      title: content.hero.title.trim(),
      description: content.hero.description.trim(),
      image: heroImage,
    },

    story: {
      ...content.story,
      eyebrow: content.story.eyebrow.trim(),
      title: content.story.title.trim(),
      paragraphs: content.story.paragraphs
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      image: storyImage,
    },

    values: {
      ...content.values,
      eyebrow: content.values.eyebrow.trim(),
      title: content.values.title.trim(),
      description: content.values.description.trim(),
      items: normalizeSortOrders(
        sortedValues.map((item) => ({
          ...item,
          title: item.title.trim(),
          description: item.description.trim(),
        })),
      ),
    },

    statistics: {
      ...content.statistics,
      eyebrow: content.statistics.eyebrow.trim(),
      title: content.statistics.title.trim(),
      items: normalizeSortOrders(
        sortedStatistics.map((item) => ({
          ...item,
          value: Number(item.value),
          suffix: (item.suffix ?? "").trim(),
          label: item.label.trim(),
        })),
      ),
    },

    gallery: {
      ...content.gallery,
      eyebrow: content.gallery.eyebrow.trim(),
      title: content.gallery.title.trim(),
      description: content.gallery.description.trim(),
      images: normalizeSortOrders(
        sortedGalleryImages.map((image) => ({
          ...image,
          url: image.url.trim(),
          alt: image.alt.trim(),
          storagePath: image.storagePath ?? "",
        })),
      ),
    },
  };
}

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const validationErrors = validateContent();

    if (validationErrors.length > 0) {
      showNotice(
        "error",
        `Lütfen aşağıdaki alanları düzeltin: ${validationErrors.join(
          " ",
        )}`,
        false,
      );

      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const normalizedContent = prepareContentForSave();

      await saveAboutContent(normalizedContent);

      const clonedContent = deepClone(normalizedContent);
      const snapshot = serializeContent(clonedContent);

      setContent(clonedContent);
      setSavedSnapshot(snapshot);

      showNotice(
        "success",
        "Hakkımızda sayfası başarıyla kaydedildi.",
      );
    } catch (reason: unknown) {
      console.error("About content could not be saved:", reason);

      showNotice(
        "error",
        reason instanceof Error
          ? reason.message
          : "İçerik kaydedilemedi.",
        false,
      );
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    if (
      !window.confirm(
        "Tüm hakkımızda içeriği varsayılan değerlere dönecek. Bu işlem henüz Firestore’a kaydedilmez. Devam edilsin mi?",
      )
    ) {
      return;
    }

    setContent(deepClone(defaultContent));

    showNotice(
      "info",
      "Varsayılan içerik forma aktarıldı. Kalıcı olması için kaydetmeniz gerekir.",
      false,
    );
  }

function updateHeroImage(
  field: "url" | "alt",
  value: string,
) {
  setContent((current) => {
    const currentImage =
      current.hero.image ?? createEmptyImageAsset("about-hero");

    return {
      ...current,
      hero: {
        ...current.hero,
        image: {
          ...currentImage,
          [field]: value,
        },
      },
    };
  });
}

 function removeHeroImage() {
  setContent((current) => ({
    ...current,
    hero: {
      ...current.hero,
      image: undefined,
    },
  }));
}

function updateStoryImage(
  field: "url" | "alt",
  value: string,
) {
  setContent((current) => {
    const currentImage =
      current.story.image ?? createEmptyImageAsset("about-story");

    return {
      ...current,
      story: {
        ...current.story,
        image: {
          ...currentImage,
          [field]: value,
        },
      },
    };
  });
}

 function removeStoryImage() {
  setContent((current) => ({
    ...current,
    story: {
      ...current.story,
      image: undefined,
    },
  }));
}

  function addValueItem() {
    const newItem: ValueItem = {
      id: createId("value"),
      title: "Yeni değer",
      description: "Bu değerin açıklamasını buraya yazın.",
      icon: "store" as ValueItem["icon"],
      sortOrder: content.values.items.length,
    };

    setContent((current) => ({
      ...current,
      values: {
        ...current.values,
        items: [...current.values.items, newItem],
      },
    }));
  }

  function updateValueItem(
    id: string,
    updater: (item: ValueItem) => ValueItem,
  ) {
    setContent((current) => ({
      ...current,
      values: {
        ...current.values,
        items: current.values.items.map((item) =>
          item.id === id ? updater(item) : item,
        ),
      },
    }));
  }

  function removeValueItem(id: string) {
    const item = content.values.items.find(
      (valueItem) => valueItem.id === id,
    );

    if (
      !window.confirm(
        `"${item?.title || "Bu değer"}" kartını silmek istiyor musunuz?`,
      )
    ) {
      return;
    }

    setContent((current) => ({
      ...current,
      values: {
        ...current.values,
        items: normalizeSortOrders(
          current.values.items
            .filter((valueItem) => valueItem.id !== id)
            .sort(
              (first, second) =>
                first.sortOrder - second.sortOrder,
            ),
        ),
      },
    }));
  }

  function moveValueItem(index: number, direction: -1 | 1) {
    const movedItems = moveItem(
      sortedValues,
      index,
      index + direction,
    );

    setContent((current) => ({
      ...current,
      values: {
        ...current.values,
        items: normalizeSortOrders(movedItems),
      },
    }));
  }

  function addStatisticItem() {
    const newItem: StatisticItem = {
      id: createId("statistic"),
      value: 0,
      suffix: "+",
      label: "Yeni istatistik",
      sortOrder: content.statistics.items.length,
    };

    setContent((current) => ({
      ...current,
      statistics: {
        ...current.statistics,
        items: [...current.statistics.items, newItem],
      },
    }));
  }

  function updateStatisticItem(
    id: string,
    updater: (item: StatisticItem) => StatisticItem,
  ) {
    setContent((current) => ({
      ...current,
      statistics: {
        ...current.statistics,
        items: current.statistics.items.map((item) =>
          item.id === id ? updater(item) : item,
        ),
      },
    }));
  }

  function removeStatisticItem(id: string) {
    const item = content.statistics.items.find(
      (statisticItem) => statisticItem.id === id,
    );

    if (
      !window.confirm(
        `"${item?.label || "Bu istatistik"}" alanını silmek istiyor musunuz?`,
      )
    ) {
      return;
    }

    setContent((current) => ({
      ...current,
      statistics: {
        ...current.statistics,
        items: normalizeSortOrders(
          current.statistics.items
            .filter((statisticItem) => statisticItem.id !== id)
            .sort(
              (first, second) =>
                first.sortOrder - second.sortOrder,
            ),
        ),
      },
    }));
  }

  function moveStatisticItem(index: number, direction: -1 | 1) {
    const movedItems = moveItem(
      sortedStatistics,
      index,
      index + direction,
    );

    setContent((current) => ({
      ...current,
      statistics: {
        ...current.statistics,
        items: normalizeSortOrders(movedItems),
      },
    }));
  }

  function addGalleryImage() {
  const newImage: GalleryImage = {
    id: createId("gallery"),
    url: "",
    alt: "",
    storagePath: "",
    sortOrder: content.gallery.images.length,
  };

  setContent((current) => ({
    ...current,
    gallery: {
      ...current.gallery,
      images: [...current.gallery.images, newImage],
    },
  }));
}

  function updateGalleryImage(
    id: string,
    updater: (image: GalleryImage) => GalleryImage,
  ) {
    setContent((current) => ({
      ...current,
      gallery: {
        ...current.gallery,
        images: current.gallery.images.map((image) =>
          image.id === id ? updater(image) : image,
        ),
      },
    }));
  }

  function removeGalleryImage(id: string) {
    if (
      !window.confirm(
        "Bu galeri görselini kaldırmak istiyor musunuz?",
      )
    ) {
      return;
    }

    setContent((current) => ({
      ...current,
      gallery: {
        ...current.gallery,
        images: normalizeSortOrders(
          current.gallery.images
            .filter((image) => image.id !== id)
            .sort(
              (first, second) =>
                first.sortOrder - second.sortOrder,
            ),
        ),
      },
    }));
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const movedImages = moveItem(
      sortedGalleryImages,
      index,
      index + direction,
    );

    setContent((current) => ({
      ...current,
      gallery: {
        ...current.gallery,
        images: normalizeSortOrders(movedImages),
      },
    }));
  }

  if (loading) {
    return (
      <>
        <AdminPageHeading
          eyebrow="HAKKIMIZDA"
          title="Hakkımızda Yönetimi"
          description="Marka hikâyesi yükleniyor."
        />

        <div className="admin-panel">
          <div className="admin-loading-state">
            <span className="admin-loading-spinner" />
            <p>Hakkımızda içeriği getiriliyor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="HAKKIMIZDA"
        title="Hakkımızda Yönetimi"
        description="Marka hikâyesini, değerleri, istatistikleri ve galeri içeriklerini yönetin."
      />

      <form
        className="admin-editor"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="admin-editor-toolbar admin-panel">
          <div className="admin-editor-toolbar__status">
            <span
              className={
                isDirty
                  ? "admin-status-dot admin-status-dot--warning"
                  : "admin-status-dot admin-status-dot--success"
              }
            />

            <div>
              <strong>
                {isDirty
                  ? "Kaydedilmemiş değişiklikler var"
                  : "Tüm değişiklikler kaydedildi"}
              </strong>

              <small>
                {isDirty
                  ? "Yaptığınız düzenlemeleri yayınlamak için kaydetmelisiniz."
                  : "Hakkımızda içeriği güncel durumda."}
              </small>
            </div>
          </div>

          <div className="admin-editor-toolbar__actions">
            <button
              type="button"
              className="admin-secondary-button"
              disabled={saving}
              onClick={() =>
                void loadContent({ askBeforeDiscard: true })
              }
            >
              Yeniden Yükle
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              disabled={saving}
              onClick={resetToDefaults}
            >
              Varsayılana Dön
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving || !isDirty}
            >
              <Icon name="save" size={18} />
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`admin-notice admin-notice--${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <span>{notice.text}</span>

            <button
              type="button"
              aria-label="Bildirimi kapat"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        <section className="admin-panel admin-form-section">
          <SectionHeading
            number="01"
            title="Hero Alanı"
            description="Hakkımızda sayfasının ilk karşılama bölümünü yönetin."
          />

          <div className="admin-form-grid admin-form-grid--two">
            <div className="admin-form-stack">
              <label className="admin-field">
                <span>Üst Etiket</span>

                <input
                  value={content.hero.eyebrow}
                  maxLength={80}
                  placeholder="BİZ KİMİZ?"
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                />

                <small>
                  Başlığın üzerinde küçük harflerle gösterilir.
                </small>
              </label>

              <label className="admin-field">
                <span>Başlık *</span>

                <input
                  required
                  value={content.hero.title}
                  maxLength={140}
                  placeholder="Güvenilir alışverişin doğru adresi"
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        title: event.target.value,
                      },
                    }))
                  }
                />

                <small>
                  {content.hero.title.length}/140 karakter
                </small>
              </label>

              <label className="admin-field">
                <span>Açıklama *</span>

                <textarea
                  required
                  rows={6}
                  maxLength={600}
                  value={content.hero.description}
                  placeholder="Markanızı kısa ve güçlü bir şekilde anlatın."
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        description: event.target.value,
                      },
                    }))
                  }
                />

                <small>
                  {content.hero.description.length}/600 karakter
                </small>
              </label>
            </div>

            <div className="admin-form-stack">
              <ImagePreview
                url={content.hero.image?.url}
                alt={content.hero.image?.alt}
                emptyText="Hero görseli önizlemesi"
              />

              <label className="admin-field">
                <span>Hero Görsel URL</span>

                <input
                  type="url"
                  value={content.hero.image?.url ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    updateHeroImage("url", event.target.value)
                  }
                />
              </label>

              <label className="admin-field">
                <span>Görsel Açıklaması</span>

                <input
                  value={content.hero.image?.alt ?? ""}
                  maxLength={180}
                  placeholder="Mağaza içinden genel görünüm"
                  onChange={(event) =>
                    updateHeroImage("alt", event.target.value)
                  }
                />
              </label>

              {content.hero.image && (
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={removeHeroImage}
                >
                  Hero Görselini Kaldır
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="admin-panel admin-form-section">
          <SectionHeading
            number="02"
            title="Marka Hikâyesi"
            description="Kurumsal geçmişinizi ve müşterilerinize sunduğunuz yaklaşımı anlatın."
          />

          <div className="admin-form-grid admin-form-grid--two">
            <div className="admin-form-stack">
              <label className="admin-field">
                <span>Üst Etiket</span>

                <input
                  value={content.story.eyebrow}
                  maxLength={80}
                  placeholder="HİKÂYEMİZ"
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      story: {
                        ...current.story,
                        eyebrow: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Başlık *</span>

                <input
                  required
                  value={content.story.title}
                  maxLength={160}
                  placeholder="Her ürünün yeni bir hikâyesi olduğuna inanıyoruz"
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      story: {
                        ...current.story,
                        title: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Paragraflar *</span>

                <textarea
                  required
                  rows={14}
                  value={content.story.paragraphs.join("\n\n")}
                  placeholder="Paragrafları boş satırla birbirinden ayırın."
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      story: {
                        ...current.story,
                        paragraphs: event.target.value
                          .split(/\n\s*\n/)
                          .map((paragraph) => paragraph.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                />

                <small>
                  Her paragrafı boş bir satırla ayırın. Şu anda{" "}
                  {content.story.paragraphs.length} paragraf var.
                </small>
              </label>
            </div>

            <div className="admin-form-stack">
              <ImagePreview
                url={content.story.image?.url}
                alt={content.story.image?.alt}
                emptyText="Hikâye görseli önizlemesi"
              />

              <label className="admin-field">
                <span>Hikâye Görsel URL</span>

                <input
                  type="url"
                  value={content.story.image?.url ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    updateStoryImage("url", event.target.value)
                  }
                />
              </label>

              <label className="admin-field">
                <span>Görsel Açıklaması</span>

                <input
                  value={content.story.image?.alt ?? ""}
                  maxLength={180}
                  placeholder="Uğur Bey Spot mağazası"
                  onChange={(event) =>
                    updateStoryImage("alt", event.target.value)
                  }
                />
              </label>

              {content.story.image && (
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={removeStoryImage}
                >
                  Hikâye Görselini Kaldır
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="admin-panel admin-form-section">
          <SectionHeading
            number="03"
            title="Marka Değerleri"
            description="Müşterilerinize sunduğunuz temel değerleri kartlar halinde yönetin."
          >
            <button
              type="button"
              className="admin-secondary-button"
              onClick={addValueItem}
            >
              + Yeni Değer
            </button>
          </SectionHeading>

          <div className="admin-form-grid admin-form-grid--three">
            <label className="admin-field">
              <span>Üst Etiket</span>

              <input
                value={content.values.eyebrow}
                maxLength={80}
                placeholder="DEĞERLERİMİZ"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    values: {
                      ...current.values,
                      eyebrow: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Başlık</span>

              <input
                value={content.values.title}
                maxLength={160}
                placeholder="Bizi farklı kılan değerler"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    values: {
                      ...current.values,
                      title: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Açıklama</span>

              <textarea
                rows={4}
                value={content.values.description}
                maxLength={400}
                placeholder="Değerler bölümünün kısa açıklaması"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    values: {
                      ...current.values,
                      description: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>

          {sortedValues.length === 0 ? (
            <div className="admin-inline-empty">
              <p>Henüz marka değeri eklenmedi.</p>

              <button
                type="button"
                className="admin-primary-button"
                onClick={addValueItem}
              >
                İlk Değeri Ekle
              </button>
            </div>
          ) : (
            <div className="admin-repeatable-list">
              {sortedValues.map((item, index) => (
                <article
                  className="admin-repeatable-card"
                  key={item.id}
                >
                  <div className="admin-repeatable-card__header">
                    <div>
                      <span>
                        DEĞER {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{item.title || "Başlıksız değer"}</h3>
                    </div>

                    <div className="admin-repeatable-card__actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={index === 0}
                        aria-label="Yukarı taşı"
                        onClick={() => moveValueItem(index, -1)}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={index === sortedValues.length - 1}
                        aria-label="Aşağı taşı"
                        onClick={() => moveValueItem(index, 1)}
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button admin-icon-button--danger"
                        aria-label="Değeri sil"
                        onClick={() => removeValueItem(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="admin-form-grid admin-form-grid--three">
                    <label className="admin-field">
                      <span>İkon Adı</span>

                      <input
                        value={String(item.icon)}
                        placeholder="store"
                        onChange={(event) =>
                          updateValueItem(item.id, (currentItem) => ({
                            ...currentItem,
                            icon: event.target
                              .value as ValueItem["icon"],
                          }))
                        }
                      />

                      <small>
                        Icon bileşeninde tanımlı bir ikon adı girin.
                      </small>
                    </label>

                    <label className="admin-field">
                      <span>Başlık *</span>

                      <input
                        required
                        value={item.title}
                        maxLength={100}
                        onChange={(event) =>
                          updateValueItem(item.id, (currentItem) => ({
                            ...currentItem,
                            title: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="admin-field">
                      <span>Sıra</span>

                      <input
                        value={index + 1}
                        readOnly
                        aria-label="Gösterim sırası"
                      />
                    </label>
                  </div>

                  <label className="admin-field">
                    <span>Açıklama *</span>

                    <textarea
                      required
                      rows={4}
                      maxLength={350}
                      value={item.description}
                      onChange={(event) =>
                        updateValueItem(item.id, (currentItem) => ({
                          ...currentItem,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-form-section">
          <SectionHeading
            number="04"
            title="İstatistikler"
            description="Deneyim, ürün, müşteri veya teslimat sayılarını yönetin."
          >
            <button
              type="button"
              className="admin-secondary-button"
              onClick={addStatisticItem}
            >
              + Yeni İstatistik
            </button>
          </SectionHeading>

          <div className="admin-form-grid admin-form-grid--two">
            <label className="admin-field">
              <span>Üst Etiket</span>

              <input
                value={content.statistics.eyebrow}
                maxLength={80}
                placeholder="RAKAMLARLA BİZ"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    statistics: {
                      ...current.statistics,
                      eyebrow: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Başlık</span>

              <input
                value={content.statistics.title}
                maxLength={160}
                placeholder="Güvenle büyüyen bir marka"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    statistics: {
                      ...current.statistics,
                      title: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>

          {sortedStatistics.length === 0 ? (
            <div className="admin-inline-empty">
              <p>
                İstatistik eklenmediği için bu bölüm sitede
                gösterilmeyecek.
              </p>

              <button
                type="button"
                className="admin-primary-button"
                onClick={addStatisticItem}
              >
                İlk İstatistiği Ekle
              </button>
            </div>
          ) : (
            <div className="admin-repeatable-list">
              {sortedStatistics.map((item, index) => (
                <article
                  className="admin-repeatable-card"
                  key={item.id}
                >
                  <div className="admin-repeatable-card__header">
                    <div>
                      <span>
                        İSTATİSTİK{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{item.label || "Başlıksız istatistik"}</h3>
                    </div>

                    <div className="admin-repeatable-card__actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={index === 0}
                        aria-label="Yukarı taşı"
                        onClick={() =>
                          moveStatisticItem(index, -1)
                        }
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={
                          index === sortedStatistics.length - 1
                        }
                        aria-label="Aşağı taşı"
                        onClick={() =>
                          moveStatisticItem(index, 1)
                        }
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button admin-icon-button--danger"
                        aria-label="İstatistiği sil"
                        onClick={() =>
                          removeStatisticItem(item.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="admin-form-grid admin-form-grid--three">
                    <label className="admin-field">
                      <span>Değer *</span>

                      <input
                        required
                        type="number"
                        min={0}
                        step="any"
                        value={item.value}
                        onChange={(event) =>
                          updateStatisticItem(
                            item.id,
                            (currentItem) => ({
                              ...currentItem,
                              value:
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value),
                            }),
                          )
                        }
                      />
                    </label>

                    <label className="admin-field">
                      <span>Son Ek</span>

                      <input
                        value={item.suffix}
                        maxLength={12}
                        placeholder="+"
                        onChange={(event) =>
                          updateStatisticItem(
                            item.id,
                            (currentItem) => ({
                              ...currentItem,
                              suffix: event.target.value,
                            }),
                          )
                        }
                      />

                      <small>Örnek: +, %, yıl</small>
                    </label>

                    <label className="admin-field">
                      <span>Etiket *</span>

                      <input
                        required
                        value={item.label}
                        maxLength={100}
                        placeholder="Mutlu müşteri"
                        onChange={(event) =>
                          updateStatisticItem(
                            item.id,
                            (currentItem) => ({
                              ...currentItem,
                              label: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-stat-preview">
                    <strong>
                      {Number(item.value || 0).toLocaleString(
                        "tr-TR",
                      )}
                      {item.suffix}
                    </strong>

                    <span>{item.label}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-form-section">
          <SectionHeading
            number="05"
            title="Galeri"
            description="Mağaza, ürün ve hizmet görsellerini hakkımızda sayfasında sergileyin."
          >
            <button
              type="button"
              className="admin-secondary-button"
              onClick={addGalleryImage}
            >
              + Yeni Görsel
            </button>
          </SectionHeading>

          <div className="admin-form-grid admin-form-grid--three">
            <label className="admin-field">
              <span>Üst Etiket</span>

              <input
                value={content.gallery.eyebrow}
                maxLength={80}
                placeholder="MAĞAZAMIZDAN"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    gallery: {
                      ...current.gallery,
                      eyebrow: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Başlık</span>

              <input
                value={content.gallery.title}
                maxLength={160}
                placeholder="Yakından tanıyın"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    gallery: {
                      ...current.gallery,
                      title: event.target.value,
                    },
                  }))
                }
              />
            </label>

            <label className="admin-field">
              <span>Açıklama</span>

              <textarea
                rows={4}
                maxLength={400}
                value={content.gallery.description}
                placeholder="Galeri bölümünün kısa açıklaması"
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    gallery: {
                      ...current.gallery,
                      description: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>

          {sortedGalleryImages.length === 0 ? (
            <div className="admin-inline-empty">
              <p>
                Galeri görseli eklenmediği için bu bölüm sitede
                gösterilmeyecek.
              </p>

              <button
                type="button"
                className="admin-primary-button"
                onClick={addGalleryImage}
              >
                İlk Görseli Ekle
              </button>
            </div>
          ) : (
            <div className="admin-gallery-editor-grid">
              {sortedGalleryImages.map((image, index) => (
                <article
                  className="admin-gallery-editor-card"
                  key={image.id}
                >
                  <div className="admin-gallery-editor-card__header">
                    <strong>
                      Görsel {String(index + 1).padStart(2, "0")}
                    </strong>

                    <div className="admin-repeatable-card__actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={index === 0}
                        aria-label="Yukarı taşı"
                        onClick={() =>
                          moveGalleryImage(index, -1)
                        }
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button"
                        disabled={
                          index === sortedGalleryImages.length - 1
                        }
                        aria-label="Aşağı taşı"
                        onClick={() =>
                          moveGalleryImage(index, 1)
                        }
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        className="admin-icon-button admin-icon-button--danger"
                        aria-label="Görseli sil"
                        onClick={() =>
                          removeGalleryImage(image.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <ImagePreview
                    url={image.url}
                    alt={image.alt}
                    emptyText="Galeri görseli önizlemesi"
                  />

                  <label className="admin-field">
                    <span>Görsel URL *</span>

                    <input
                      required
                      type="url"
                      value={image.url}
                      placeholder="https://..."
                      onChange={(event) =>
                        updateGalleryImage(
                          image.id,
                          (currentImage) => ({
                            ...currentImage,
                            url: event.target.value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>Alternatif Metin</span>

                    <input
                      value={image.alt}
                      maxLength={180}
                      placeholder="Mağaza içinden ürün görünümü"
                      onChange={(event) =>
                        updateGalleryImage(
                          image.id,
                          (currentImage) => ({
                            ...currentImage,
                            alt: event.target.value,
                          }),
                        )
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="admin-sticky-save">
          <div className="admin-sticky-save__status">
            <span
              className={
                isDirty
                  ? "admin-status-dot admin-status-dot--warning"
                  : "admin-status-dot admin-status-dot--success"
              }
            />

            <div>
              <strong>
                {isDirty
                  ? "Değişiklikler bekliyor"
                  : "İçerik güncel"}
              </strong>

              <small>
                {isDirty
                  ? "Kaydetmeden sayfadan ayrılmayın."
                  : "Son düzenlemeler kaydedildi."}
              </small>
            </div>
          </div>

          <button
            type="submit"
            className="admin-primary-button admin-primary-button--large"
            disabled={saving || !isDirty}
          >
            <Icon name="save" size={19} />

            {saving
              ? "Hakkımızda Sayfası Kaydediliyor..."
              : isDirty
                ? "Hakkımızda Sayfasını Kaydet"
                : "Tüm Değişiklikler Kaydedildi"}
          </button>
        </div>
      </form>
    </>
  );
}