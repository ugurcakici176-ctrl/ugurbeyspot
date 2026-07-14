"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";

import {
  DEFAULT_LEGAL_PAGES,
  LEGAL_PAGE_LABELS,
  getLegalPage,
  saveLegalPage,
  type LegalPageDocument,
  type LegalPageKey,
} from "@/lib/legal-pages";

const PAGE_KEYS: LegalPageKey[] = [
  "privacy",
  "kvkk",
  "cookies",
  "terms",
];

function cloneLegalPage(
  page: LegalPageDocument,
): LegalPageDocument {
  return JSON.parse(
    JSON.stringify(page),
  ) as LegalPageDocument;
}

function createSectionId(): string {
  return [
    "legal",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 9),
  ].join("-");
}

export default function LegalPagesAdminClient() {
  const [
    selectedKey,
    setSelectedKey,
  ] = useState<LegalPageKey>("privacy");

  const [
    page,
    setPage,
  ] = useState<LegalPageDocument>(() =>
    cloneLegalPage(
      DEFAULT_LEGAL_PAGES.privacy,
    ),
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPage(): Promise<void> {
      setLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      try {
        const data = await getLegalPage(
          selectedKey,
        );

        if (!active) {
          return;
        }

        setPage(
          cloneLegalPage(data),
        );
      } catch (error: unknown) {
        console.error(
          "Yasal metin yükleme hatası:",
          error,
        );

        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Yasal metin yüklenemedi.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [selectedKey]);

  function updatePageField<
    TKey extends
      | "eyebrow"
      | "title"
      | "description"
      | "lastUpdatedLabel",
  >(
    key: TKey,
    value: LegalPageDocument[TKey],
  ): void {
    setPage((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSection(
    sectionId: string,
    field: "title" | "body",
    value: string,
  ): void {
    setPage((current) => ({
      ...current,

      sections: current.sections.map(
        (section) =>
          section.id === sectionId
            ? {
                ...section,
                [field]: value,
              }
            : section,
      ),
    }));
  }

  function addSection(): void {
    setPage((current) => ({
      ...current,

      sections: [
        ...current.sections,
        {
          id: createSectionId(),
          title: "Yeni Bölüm",
          body: "",
        },
      ],
    }));
  }

  function deleteSection(
    sectionId: string,
  ): void {
    const confirmed = window.confirm(
      "Bu bölümü silmek istediğinize emin misiniz?",
    );

    if (!confirmed) {
      return;
    }

    setPage((current) => ({
      ...current,

      sections: current.sections.filter(
        (section) =>
          section.id !== sectionId,
      ),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const title = page.title.trim();

      if (!title) {
        throw new Error(
          "Sayfa başlığı zorunludur.",
        );
      }

      const sections = page.sections
        .map((section) => ({
          ...section,
          title: section.title.trim(),
          body: section.body.trim(),
        }))
        .filter(
          (section) =>
            section.title.length > 0 ||
            section.body.length > 0,
        );

      const cleanedPage: LegalPageDocument = {
        ...page,

        eyebrow: page.eyebrow.trim(),

        title,

        description:
          page.description.trim(),

        lastUpdatedLabel:
          page.lastUpdatedLabel.trim(),

        sections,
      };

      await saveLegalPage(
        cleanedPage,
      );

      setPage(
        cloneLegalPage(cleanedPage),
      );

      setSuccessMessage(
        "Yasal metin başarıyla kaydedildi.",
      );
    } catch (error: unknown) {
      console.error(
        "Yasal metin kayıt hatası:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Yasal metin kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="YASAL METİNLER"
        title="Yasal Sayfa Yönetimi"
        description="Gizlilik, KVKK, çerez ve kullanım koşulları sayfalarını tek merkezden yönetin."
      />

      <div className="admin-legal-tabs">
        {PAGE_KEYS.map((key) => {
          const active =
            selectedKey === key;

          return (
            <button
              type="button"
              key={key}
              className={
                active
                  ? "is-active"
                  : undefined
              }
              aria-pressed={active}
              onClick={() =>
                setSelectedKey(key)
              }
            >
              {LEGAL_PAGE_LABELS[key]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <section className="admin-panel admin-empty">
          Yasal metin yükleniyor...
        </section>
      ) : (
        <form
          className="admin-editor"
          onSubmit={handleSubmit}
        >
          {successMessage && (
            <div
              className="admin-notice admin-notice--info"
              role="status"
            >
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div
              className="admin-notice admin-notice--error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>01</span>

              <div>
                <h2>
                  Sayfa Bilgileri
                </h2>

                <p>
                  Sayfanın başlık ve açıklama alanlarını yönetin.
                </p>
              </div>
            </div>

            <label className="admin-field">
              <span>
                Üst Küçük Metin
              </span>

              <input
                value={page.eyebrow}
                onChange={(event) =>
                  updatePageField(
                    "eyebrow",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>
                Sayfa Başlığı
              </span>

              <input
                required
                value={page.title}
                onChange={(event) =>
                  updatePageField(
                    "title",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>
                Sayfa Açıklaması
              </span>

              <textarea
                rows={4}
                value={page.description}
                onChange={(event) =>
                  updatePageField(
                    "description",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>
                Güncelleme Metni
              </span>

              <input
                value={
                  page.lastUpdatedLabel
                }
                onChange={(event) =>
                  updatePageField(
                    "lastUpdatedLabel",
                    event.target.value,
                  )
                }
              />
            </label>
          </section>

          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__heading">
              <span>02</span>

              <div>
                <h2>
                  Metin Bölümleri
                </h2>

                <p>
                  Bölüm başlıklarını ve yasal metin içeriklerini düzenleyin.
                </p>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={addSection}
              >
                <Icon
                  name="plus"
                  size={17}
                />

                Bölüm Ekle
              </button>
            </div>

            <div className="admin-legal-sections">
              {page.sections.map(
                (
                  section,
                  index,
                ) => (
                  <article
                    className="admin-legal-section"
                    key={section.id}
                  >
                    <div className="admin-legal-section__heading">
                      <strong>
                        Bölüm {index + 1}
                      </strong>

                      <button
                        type="button"
                        aria-label={`${section.title || "Bölüm"} sil`}
                        onClick={() =>
                          deleteSection(
                            section.id,
                          )
                        }
                      >
                        <Icon
                          name="trash"
                          size={16}
                        />
                      </button>
                    </div>

                    <label className="admin-field">
                      <span>
                        Bölüm Başlığı
                      </span>

                      <input
                        value={
                          section.title
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSection(
                            section.id,
                            "title",
                            event.target
                              .value,
                          )
                        }
                      />
                    </label>

                    <label className="admin-field">
                      <span>
                        İçerik
                      </span>

                      <textarea
                        rows={9}
                        value={
                          section.body
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSection(
                            section.id,
                            "body",
                            event.target
                              .value,
                          )
                        }
                      />
                    </label>
                  </article>
                ),
              )}

              {page.sections.length === 0 && (
                <div className="admin-empty">
                  Bu sayfada henüz bölüm bulunmuyor.
                </div>
              )}
            </div>
          </section>

          <div className="admin-sticky-save">
            <button
              type="submit"
              className="admin-primary-button admin-primary-button--large"
              disabled={saving}
            >
              <Icon
                name="save"
                size={19}
              />

              {saving
                ? "Kaydediliyor..."
                : "Yasal Metni Kaydet"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}