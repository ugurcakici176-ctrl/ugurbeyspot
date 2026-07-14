"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  deleteBrandAsset,
  uploadBrandLogo,
} from "@/lib/branding-storage";
import {
  DEFAULT_GLOBAL_SITE_SETTINGS,
  getGlobalSiteSettings,
  saveGlobalSiteSettings,
  type GlobalSiteSettings,
  type GtmConsentCategory,
} from "@/lib/global-site-settings";

type SettingsTab =
  | "general"
  | "branding"
  | "integrations"
  | "maintenance"
  | "business"
  | "technical";

const TABS: ReadonlyArray<{
  key: SettingsTab;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "general",
    label: "Genel",
    description: "Kontrol merkezi",
    icon: "grid",
  },
  {
    key: "branding",
    label: "Marka & Logo",
    description: "Kimlik ve görünüm",
    icon: "image",
  },
  {
    key: "integrations",
    label: "Entegrasyonlar",
    description: "GA4, GTM ve Pixel",
    icon: "sparkles",
  },
  {
    key: "maintenance",
    label: "Bakım Modu",
    description: "Erişim kontrolü",
    icon: "settings",
  },
  {
    key: "business",
    label: "İletişim & Sosyal",
    description: "Mağaza bilgileri",
    icon: "message-circle",
  },
  {
    key: "technical",
    label: "Teknik",
    description: "Site davranışları",
    icon: "shield-check",
  },
];

function cloneSettings(
  settings: GlobalSiteSettings,
): GlobalSiteSettings {
  return JSON.parse(
    JSON.stringify(settings),
  ) as GlobalSiteSettings;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={
        `control-toggle ${
          checked
            ? "is-active"
            : ""
        }`
      }
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() =>
        onChange(!checked)
      }
    >
      <span />
    </button>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={
        `control-status ${
          active
            ? "is-active"
            : "is-passive"
        }`
      }
    >
      <span />

      {active
        ? "Aktif"
        : "Pasif"}
    </span>
  );
}

export default function GlobalSettingsAdminClient() {
  const [
    settings,
    setSettings,
  ] = useState<GlobalSiteSettings>(
    () =>
      cloneSettings(
        DEFAULT_GLOBAL_SITE_SETTINGS,
      ),
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState<SettingsTab>(
    "general",
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
    uploadingLogo,
    setUploadingLogo,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const activeIntegrationCount =
    useMemo(
      () =>
        [
          settings.integrations.ga4
            .enabled,
          settings.integrations.gtm
            .enabled,
          settings.integrations
            .metaPixel.enabled,
        ].filter(Boolean).length,
      [settings],
    );

  useEffect(() => {
    let active = true;

    void getGlobalSiteSettings(
      true,
    )
      .then((data) => {
        if (active) {
          setSettings(
            cloneSettings(data),
          );
        }
      })
      .catch((reason: unknown) => {
        console.error(
          "Control center load error:",
          reason,
        );

        if (active) {
          setError(
            "Genel site ayarları yüklenemedi.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function clearMessages(): void {
    setMessage(null);
    setError(null);
  }

  async function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingLogo(true);
    clearMessages();

    const previousPath =
      settings.branding
        .logoStoragePath;

    try {
      const uploaded =
        await uploadBrandLogo(file);

      setSettings((current) => ({
        ...current,

        branding: {
          ...current.branding,
          logoMode: "image",
          logoUrl: uploaded.url,
          logoStoragePath:
            uploaded.path,
        },
      }));

      if (
        previousPath &&
        previousPath !==
          uploaded.path
      ) {
        await deleteBrandAsset(
          previousPath,
        );
      }

      setMessage(
        "Logo yüklendi. Tüm Ayarları Kaydet butonuna basarak yayına alın.",
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Logo yüklenemedi.",
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      const normalized: GlobalSiteSettings = {
        ...settings,

        branding: {
          ...settings.branding,
          monogram:
            settings.branding.monogram
              .trim()
              .slice(0, 4)
              .toUpperCase(),
          siteName:
            settings.branding.siteName
              .trim(),
          slogan:
            settings.branding.slogan
              .trim(),
          logoAlt:
            settings.branding.logoAlt
              .trim(),
        },

        integrations: {
          ga4: {
            ...settings.integrations.ga4,
            measurementId:
              settings.integrations.ga4
                .measurementId
                .trim()
                .toUpperCase(),
          },

          gtm: {
            ...settings.integrations.gtm,
            containerId:
              settings.integrations.gtm
                .containerId
                .trim()
                .toUpperCase(),
          },

          metaPixel: {
            ...settings.integrations
              .metaPixel,
            pixelId:
              settings.integrations
                .metaPixel.pixelId
                .trim(),
          },
        },

        updatedAt:
          new Date().toISOString(),
      };

      await saveGlobalSiteSettings(
        normalized,
      );

      setSettings(
        cloneSettings(normalized),
      );

      setMessage(
        "Site kontrol merkezi ayarları başarıyla kaydedildi.",
      );
    } catch (reason: unknown) {
      console.error(
        "Control center save error:",
        reason,
      );

      setError(
        reason instanceof Error
          ? reason.message
          : "Ayarlar kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-panel admin-empty">
        Site kontrol merkezi hazırlanıyor...
      </div>
    );
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="SITE CONTROL CENTER"
        title="Genel Site Yönetimi"
        description="Marka kimliği, ölçüm sistemleri, bakım modu, mağaza bilgileri ve teknik davranışları tek merkezden yönetin."
      />

      <form
        className="control-center"
        onSubmit={handleSubmit}
      >
        <section className="control-overview">
          <article className="control-overview__hero">
            <div>
              <span>
                SİSTEM DURUMU
              </span>

              <h2>
                Mağaza kontrolünüz altında.
              </h2>

              <p>
                Kritik site ayarlarını tek Firestore belgesi ve tek yönetim merkezinden yönetin.
              </p>
            </div>

            <div className="control-overview__mark">
              {
                settings.branding
                  .monogram || "UB"
              }
            </div>
          </article>

          <article className="control-stat-card">
            <span>
              SITE STATUS
            </span>

            <strong>
              {settings.maintenance
                .enabled
                ? "Bakımda"
                : "Yayında"}
            </strong>

            <StatusBadge
              active={
                !settings.maintenance
                  .enabled
              }
            />
          </article>

          <article className="control-stat-card">
            <span>
              INTEGRATIONS
            </span>

            <strong>
              {activeIntegrationCount}/3
            </strong>

            <small>
              Aktif ölçüm bağlantısı
            </small>
          </article>

          <article className="control-stat-card">
            <span>
              BRAND
            </span>

            <strong>
              {settings.branding
                .logoMode === "image"
                ? "Logo"
                : "Monogram"}
            </strong>

            <small>
              Aktif marka görünümü
            </small>
          </article>
        </section>

        <div className="control-layout">
          <aside className="control-tabs">
            <span className="control-tabs__label">
              AYAR GRUPLARI
            </span>

            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.key}
                className={
                  activeTab === tab.key
                    ? "is-active"
                    : undefined
                }
                onClick={() => {
                  clearMessages();
                  setActiveTab(tab.key);
                }}
              >
                <span className="control-tabs__icon">
                  <Icon
                    name={tab.icon}
                    size={18}
                  />
                </span>

                <span className="control-tabs__text">
                  <strong>
                    {tab.label}
                  </strong>

                  <small>
                    {tab.description}
                  </small>
                </span>

                <Icon
                  name="arrow-right"
                  size={15}
                />
              </button>
            ))}
          </aside>

          <main className="control-content">
            {message && (
              <div
                className="admin-notice admin-notice--info"
                role="status"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                className="admin-notice admin-notice--error"
                role="alert"
              >
                {error}
              </div>
            )}

            {activeTab === "general" && (
              <GeneralTab
                settings={settings}
                activeIntegrationCount={
                  activeIntegrationCount
                }
                onTabChange={
                  setActiveTab
                }
              />
            )}

            {activeTab === "branding" && (
              <BrandingTab
                settings={settings}
                setSettings={
                  setSettings
                }
                uploadingLogo={
                  uploadingLogo
                }
                onLogoUpload={
                  handleLogoUpload
                }
              />
            )}

            {activeTab ===
              "integrations" && (
              <IntegrationsTab
                settings={settings}
                setSettings={
                  setSettings
                }
              />
            )}

            {activeTab ===
              "maintenance" && (
              <MaintenanceTab
                settings={settings}
                setSettings={
                  setSettings
                }
              />
            )}

            {activeTab === "business" && (
              <BusinessTab
                settings={settings}
                setSettings={
                  setSettings
                }
              />
            )}

            {activeTab ===
              "technical" && (
              <TechnicalTab
                settings={settings}
                setSettings={
                  setSettings
                }
              />
            )}
          </main>
        </div>

        <div className="control-save-bar">
          <div>
            <span>
              DEĞİŞİKLİKLER
            </span>

            <strong>
              Site ayarlarını Firestore'a kaydet
            </strong>
          </div>

          <button
            type="submit"
            className="admin-primary-button admin-primary-button--large"
            disabled={
              saving ||
              uploadingLogo
            }
          >
            <Icon
              name="save"
              size={19}
            />

            {saving
              ? "Kaydediliyor..."
              : uploadingLogo
                ? "Logo yükleniyor..."
                : "Tüm Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}

function PanelHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="control-panel__heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {children}
    </div>
  );
}

function GeneralTab({
  settings,
  activeIntegrationCount,
  onTabChange,
}: {
  settings: GlobalSiteSettings;
  activeIntegrationCount: number;
  onTabChange: (
    tab: SettingsTab,
  ) => void;
}) {
  const cards: Array<{
    tab: SettingsTab;
    icon: string;
    title: string;
    text: string;
  }> = [
    {
      tab: "branding",
      icon: "image",
      title: "Marka & Logo",
      text:
        "Site adı, slogan, logo ve monogram.",
    },
    {
      tab: "integrations",
      icon: "sparkles",
      title: "Ölçüm Sistemleri",
      text:
        "GA4, Google Tag Manager ve Meta Pixel.",
    },
    {
      tab: "maintenance",
      icon: "settings",
      title: "Bakım Modu",
      text:
        "Public site erişimini kontrollü biçimde kapatın.",
    },
    {
      tab: "technical",
      icon: "shield-check",
      title: "Teknik Ayarlar",
      text:
        "Animasyon, URL, bölge ve site davranışları.",
    },
  ];

  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="GENEL DURUM"
        title="Site Kontrol Merkezi"
        description="Kritik ayarları tek bakışta görüntüleyin ve ilgili sekmeye geçin."
      />

      <div className="control-quick-grid">
        {cards.map((card) => (
          <button
            type="button"
            className="control-quick-card"
            key={card.tab}
            onClick={() =>
              onTabChange(card.tab)
            }
          >
            <Icon
              name={card.icon}
              size={23}
            />

            <strong>
              {card.title}
            </strong>

            <span>
              {card.text}
            </span>

            <Icon
              name="arrow-right"
              size={17}
            />
          </button>
        ))}
      </div>

      <div className="control-health">
        <div className="control-health__heading">
          <span>
            BAĞLANTI SAĞLIĞI
          </span>

          <strong>
            Entegrasyon Özeti · {activeIntegrationCount}/3 aktif
          </strong>
        </div>

        {[
          {
            label: "Google Analytics 4",
            active:
              settings.integrations.ga4
                .enabled,
            value:
              settings.integrations.ga4
                .measurementId ||
              "Measurement ID girilmedi",
          },
          {
            label:
              "Google Tag Manager",
            active:
              settings.integrations.gtm
                .enabled,
            value:
              settings.integrations.gtm
                .containerId ||
              "Container ID girilmedi",
          },
          {
            label: "Meta Pixel",
            active:
              settings.integrations
                .metaPixel.enabled,
            value:
              settings.integrations
                .metaPixel.pixelId ||
              "Pixel ID girilmedi",
          },
        ].map((item) => (
          <div
            className="control-health__row"
            key={item.label}
          >
            <span
              className={
                item.active
                  ? "is-active"
                  : ""
              }
            />

            <div>
              <strong>
                {item.label}
              </strong>

              <small>
                {item.value}
              </small>
            </div>

            <StatusBadge
              active={item.active}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function BrandingTab({
  settings,
  setSettings,
  uploadingLogo,
  onLogoUpload,
}: {
  settings: GlobalSiteSettings;
  setSettings:
    React.Dispatch<
      React.SetStateAction<GlobalSiteSettings>
    >;
  uploadingLogo: boolean;
  onLogoUpload: (
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
}) {
  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="MARKA KİMLİĞİ"
        title="Logo ve Marka Görünümü"
        description="Header ve bakım ekranında kullanılan ana marka kimliğini yönetin."
      />

      <div className="brand-control-grid">
        <div className="brand-preview">
          <span className="brand-preview__label">
            CANLI ÖNİZLEME
          </span>

          <div className="brand-preview__logo">
            {settings.branding
              .logoMode === "image" &&
            settings.branding.logoUrl ? (
              <img
                src={
                  settings.branding
                    .logoUrl
                }
                alt={
                  settings.branding
                    .logoAlt
                }
              />
            ) : (
              <span>
                {
                  settings.branding
                    .monogram || "UB"
                }
              </span>
            )}
          </div>

          <strong>
            {
              settings.branding
                .siteName
            }
          </strong>

          <small>
            {
              settings.branding.slogan
            }
          </small>
        </div>

        <div className="control-fields">
          <div className="control-choice-row">
            {(
              [
                [
                  "monogram",
                  "Monogram",
                ],
                [
                  "image",
                  "Görsel Logo",
                ],
              ] as const
            ).map(
              ([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  className={
                    settings.branding
                      .logoMode === mode
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setSettings(
                      (current) => ({
                        ...current,
                        branding: {
                          ...current.branding,
                          logoMode: mode,
                        },
                      }),
                    )
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <label className="admin-field">
            <span>Site Adı</span>
            <input
              value={
                settings.branding
                  .siteName
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      siteName:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>Slogan</span>
            <input
              value={
                settings.branding.slogan
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      slogan:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <div className="admin-two-columns">
            <label className="admin-field">
              <span>Monogram</span>
              <input
                maxLength={4}
                value={
                  settings.branding
                    .monogram
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      branding: {
                        ...current.branding,
                        monogram:
                          event.target.value,
                      },
                    }),
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>
                Vurgu Rengi
              </span>
              <input
                type="color"
                value={
                  settings.branding
                    .accentColor
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      branding: {
                        ...current.branding,
                        accentColor:
                          event.target.value,
                      },
                    }),
                  )
                }
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Logo Alt Metni</span>
            <input
              value={
                settings.branding.logoAlt
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      logoAlt:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="brand-upload">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) =>
                void onLogoUpload(event)
              }
            />

            <span>
              <Icon
                name="image"
                size={20}
              />

              <strong>
                {uploadingLogo
                  ? "Logo yükleniyor..."
                  : "Yeni Logo Yükle"}
              </strong>

              <small>
                JPG, PNG, WebP veya AVIF · Maksimum 5 MB
              </small>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}


function IntegrationsTab({
  settings,
  setSettings,
}: {
  settings: GlobalSiteSettings;
  setSettings:
    React.Dispatch<
      React.SetStateAction<GlobalSiteSettings>
    >;
}) {
  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="DATA & TRACKING"
        title="Ölçüm Entegrasyonları"
        description="GA4, GTM ve Meta Pixel bağlantılarını çerez tercihleriyle uyumlu biçimde yönetin."
      />

      <div className="integration-stack">
        <article className="integration-card">
          <div className="integration-card__top">
            <span className="integration-logo">
              G
            </span>

            <div>
              <strong>
                Google Analytics 4
              </strong>

              <small>
                Trafik ve kullanıcı davranışı
              </small>
            </div>

            <StatusBadge
              active={
                settings.integrations.ga4
                  .enabled
              }
            />

            <Toggle
              label="GA4 durumunu değiştir"
              checked={
                settings.integrations.ga4
                  .enabled
              }
              onChange={(checked) =>
                setSettings(
                  (current) => ({
                    ...current,
                    integrations: {
                      ...current.integrations,
                      ga4: {
                        ...current.integrations
                          .ga4,
                        enabled: checked,
                      },
                    },
                  }),
                )
              }
            />
          </div>

          <label className="admin-field">
            <span>Measurement ID</span>

            <input
              placeholder="G-XXXXXXXXXX"
              value={
                settings.integrations.ga4
                  .measurementId
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    integrations: {
                      ...current.integrations,
                      ga4: {
                        ...current.integrations
                          .ga4,
                        measurementId:
                          event.target.value,
                      },
                    },
                  }),
                )
              }
            />
          </label>

          <p className="integration-card__note">
            Yalnızca Analitik çerez izni verildiğinde yüklenir.
          </p>
        </article>

        <article className="integration-card">
          <div className="integration-card__top">
            <span className="integration-logo">
              GTM
            </span>

            <div>
              <strong>
                Google Tag Manager
              </strong>

              <small>
                Merkezi tag yönetimi
              </small>
            </div>

            <StatusBadge
              active={
                settings.integrations.gtm
                  .enabled
              }
            />

            <Toggle
              label="GTM durumunu değiştir"
              checked={
                settings.integrations.gtm
                  .enabled
              }
              onChange={(checked) =>
                setSettings(
                  (current) => ({
                    ...current,
                    integrations: {
                      ...current.integrations,
                      gtm: {
                        ...current.integrations
                          .gtm,
                        enabled: checked,
                      },
                    },
                  }),
                )
              }
            />
          </div>

          <div className="admin-two-columns">
            <label className="admin-field">
              <span>Container ID</span>

              <input
                placeholder="GTM-XXXXXXX"
                value={
                  settings.integrations.gtm
                    .containerId
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      integrations: {
                        ...current.integrations,
                        gtm: {
                          ...current.integrations
                            .gtm,
                          containerId:
                            event.target.value,
                        },
                      },
                    }),
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>İzin Kategorisi</span>

              <select
                value={
                  settings.integrations.gtm
                    .consentCategory
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      integrations: {
                        ...current.integrations,
                        gtm: {
                          ...current.integrations
                            .gtm,
                          consentCategory:
                            event.target
                              .value as GtmConsentCategory,
                        },
                      },
                    }),
                  )
                }
              >
                <option value="analytics">
                  Analitik
                </option>

                <option value="marketing">
                  Pazarlama
                </option>
              </select>
            </label>
          </div>

          <p className="integration-card__note integration-card__note--warning">
            GTM içine ayrıca GA4 etiketi kurarsanız doğrudan GA4 bağlantısıyla çift sayım oluşabilir.
          </p>
        </article>

        <article className="integration-card">
          <div className="integration-card__top">
            <span className="integration-logo integration-logo--meta">
              M
            </span>

            <div>
              <strong>
                Meta Pixel
              </strong>

              <small>
                Reklam ve dönüşüm ölçümü
              </small>
            </div>

            <StatusBadge
              active={
                settings.integrations
                  .metaPixel.enabled
              }
            />

            <Toggle
              label="Meta Pixel durumunu değiştir"
              checked={
                settings.integrations
                  .metaPixel.enabled
              }
              onChange={(checked) =>
                setSettings(
                  (current) => ({
                    ...current,
                    integrations: {
                      ...current.integrations,
                      metaPixel: {
                        ...current.integrations
                          .metaPixel,
                        enabled: checked,
                      },
                    },
                  }),
                )
              }
            />
          </div>

          <label className="admin-field">
            <span>Pixel ID</span>

            <input
              inputMode="numeric"
              placeholder="123456789012345"
              value={
                settings.integrations
                  .metaPixel.pixelId
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    integrations: {
                      ...current.integrations,
                      metaPixel: {
                        ...current.integrations
                          .metaPixel,
                        pixelId:
                          event.target.value,
                      },
                    },
                  }),
                )
              }
            />
          </label>

          <p className="integration-card__note">
            Yalnızca Pazarlama çerez izni verildiğinde yüklenir.
          </p>
        </article>
      </div>
    </section>
  );
}

function MaintenanceTab({
  settings,
  setSettings,
}: {
  settings: GlobalSiteSettings;
  setSettings:
    React.Dispatch<
      React.SetStateAction<GlobalSiteSettings>
    >;
}) {
  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="ERİŞİM KONTROLÜ"
        title="Bakım Modu"
        description="Public siteyi tek tuşla bakım ekranına alın ve admin bypass davranışını yönetin."
      >
        <StatusBadge
          active={
            settings.maintenance.enabled
          }
        />
      </PanelHeading>

      <div
        className={
          `maintenance-switch-card ${
            settings.maintenance.enabled
              ? "is-active"
              : ""
          }`
        }
      >
        <div>
          <span>SİTE ERİŞİMİ</span>

          <strong>
            {settings.maintenance.enabled
              ? "Bakım modu aktif"
              : "Site normal yayında"}
          </strong>

          <p>
            {settings.maintenance.enabled
              ? "Ziyaretçiler bakım ekranını görüyor."
              : "Public site tüm ziyaretçilere açık."}
          </p>
        </div>

        <Toggle
          label="Bakım modunu değiştir"
          checked={
            settings.maintenance.enabled
          }
          onChange={(checked) =>
            setSettings(
              (current) => ({
                ...current,
                maintenance: {
                  ...current.maintenance,
                  enabled: checked,
                },
              }),
            )
          }
        />
      </div>

      <div className="control-setting-row">
        <div>
          <strong>Admin bypass</strong>

          <span>
            Aktif admin hesapları bakım modunda public siteyi görüntüleyebilir.
          </span>
        </div>

        <Toggle
          label="Admin bypass ayarı"
          checked={
            settings.maintenance
              .allowAdminBypass
          }
          onChange={(checked) =>
            setSettings(
              (current) => ({
                ...current,
                maintenance: {
                  ...current.maintenance,
                  allowAdminBypass: checked,
                },
              }),
            )
          }
        />
      </div>

      <div className="control-fields">
        <label className="admin-field">
          <span>Üst Küçük Metin</span>
          <input
            value={
              settings.maintenance.eyebrow
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  maintenance: {
                    ...current.maintenance,
                    eyebrow:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <label className="admin-field">
          <span>Bakım Başlığı</span>
          <input
            value={
              settings.maintenance.title
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  maintenance: {
                    ...current.maintenance,
                    title:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <label className="admin-field">
          <span>Açıklama</span>
          <textarea
            rows={5}
            value={
              settings.maintenance
                .description
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  maintenance: {
                    ...current.maintenance,
                    description:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Durum Metni</span>
            <input
              value={
                settings.maintenance
                  .statusText
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    maintenance: {
                      ...current.maintenance,
                      statusText:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>
              Tahmini Bitiş Metni
            </span>
            <input
              placeholder="Örn. 14 Temmuz 22:00"
              value={
                settings.maintenance
                  .estimatedEndText
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    maintenance: {
                      ...current.maintenance,
                      estimatedEndText:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>
        </div>

        <div className="control-setting-row">
          <div>
            <strong>
              İletişim butonu
            </strong>

            <span>
              Bakım ekranında ziyaretçiye iletişim bağlantısı göster.
            </span>
          </div>

          <Toggle
            label="Bakım iletişim butonu"
            checked={
              settings.maintenance
                .showContactButton
            }
            onChange={(checked) =>
              setSettings(
                (current) => ({
                  ...current,
                  maintenance: {
                    ...current.maintenance,
                    showContactButton:
                      checked,
                  },
                }),
              )
            }
          />
        </div>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Buton Yazısı</span>
            <input
              value={
                settings.maintenance
                  .contactButtonLabel
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    maintenance: {
                      ...current.maintenance,
                      contactButtonLabel:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>Buton Linki</span>
            <input
              value={
                settings.maintenance
                  .contactButtonHref
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    maintenance: {
                      ...current.maintenance,
                      contactButtonHref:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function BusinessTab({
  settings,
  setSettings,
}: {
  settings: GlobalSiteSettings;
  setSettings:
    React.Dispatch<
      React.SetStateAction<GlobalSiteSettings>
    >;
}) {
  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="MAĞAZA BİLGİLERİ"
        title="İletişim ve Sosyal Medya"
        description="İşletmenin temel iletişim ve sosyal bağlantılarını tek merkezde saklayın."
      />

      <div className="control-fields">
        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Telefon</span>
            <input
              value={
                settings.business.phone
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    business: {
                      ...current.business,
                      phone:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>E-posta</span>
            <input
              type="email"
              value={
                settings.business.email
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    business: {
                      ...current.business,
                      email:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>
        </div>

        <label className="admin-field">
          <span>WhatsApp</span>
          <input
            value={
              settings.business.whatsapp
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    whatsapp:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <label className="admin-field">
          <span>Açık Adres</span>
          <textarea
            rows={3}
            value={
              settings.business.address
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  business: {
                    ...current.business,
                    address:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Harita Linki</span>
            <input
              value={
                settings.business.mapsUrl
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    business: {
                      ...current.business,
                      mapsUrl:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>Çalışma Saatleri</span>
            <input
              value={
                settings.business
                  .workingHours
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    business: {
                      ...current.business,
                      workingHours:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>
        </div>

        <div className="control-divider">
          SOSYAL MEDYA
        </div>

        <div className="admin-two-columns">
          {(
            [
              [
                "instagram",
                "Instagram",
              ],
              [
                "facebook",
                "Facebook",
              ],
              [
                "tiktok",
                "TikTok",
              ],
              [
                "youtube",
                "YouTube",
              ],
            ] as const
          ).map(([key, label]) => (
            <label
              className="admin-field"
              key={key}
            >
              <span>{label}</span>

              <input
                value={
                  settings.social[key]
                }
                onChange={(event) =>
                  setSettings(
                    (current) => ({
                      ...current,
                      social: {
                        ...current.social,
                        [key]:
                          event.target.value,
                      },
                    }),
                  )
                }
              />
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechnicalTab({
  settings,
  setSettings,
}: {
  settings: GlobalSiteSettings;
  setSettings:
    React.Dispatch<
      React.SetStateAction<GlobalSiteSettings>
    >;
}) {
  const switches = [
    {
      key:
        "enableAnimations" as const,
      title:
        "Gelişmiş animasyonlar",
      description:
        "Hero, reveal ve premium geçiş efektlerini etkin tut.",
    },
    {
      key:
        "enablePageTransitions" as const,
      title:
        "Sayfa geçiş deneyimi",
      description:
        "Geçiş davranışlarını aktif site ayarı olarak sakla.",
    },
    {
      key:
        "enableImageLazyLoading" as const,
      title:
        "Görsel lazy loading",
      description:
        "Desteklenen alanlarda görselleri ihtiyaç anında yükle.",
    },
    {
      key:
        "showAnnouncementBar" as const,
      title:
        "Duyuru alanı",
      description:
        "Aktif duyuru barının gösterimine izin ver.",
    },
  ];

  return (
    <section className="control-panel">
      <PanelHeading
        eyebrow="SYSTEM BEHAVIOUR"
        title="Teknik Site Ayarları"
        description="Site URL, yerel ayarlar ve genel site davranışlarını yönetin."
      />

      <div className="control-fields">
        <label className="admin-field">
          <span>Canlı Site URL</span>

          <input
            type="url"
            value={
              settings.technical.siteUrl
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  technical: {
                    ...current.technical,
                    siteUrl:
                      event.target.value,
                  },
                }),
              )
            }
          />
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Varsayılan Dil</span>
            <input
              value={
                settings.technical
                  .defaultLocale
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    technical: {
                      ...current.technical,
                      defaultLocale:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>

          <label className="admin-field">
            <span>Saat Dilimi</span>
            <input
              value={
                settings.technical
                  .timezone
              }
              onChange={(event) =>
                setSettings(
                  (current) => ({
                    ...current,
                    technical: {
                      ...current.technical,
                      timezone:
                        event.target.value,
                    },
                  }),
                )
              }
            />
          </label>
        </div>

        <label className="admin-field">
          <span>Para Birimi</span>
          <input
            maxLength={3}
            value={
              settings.technical.currency
            }
            onChange={(event) =>
              setSettings(
                (current) => ({
                  ...current,
                  technical: {
                    ...current.technical,
                    currency:
                      event.target.value
                        .toUpperCase(),
                  },
                }),
              )
            }
          />
        </label>

        {switches.map((item) => (
          <div
            className="control-setting-row"
            key={item.key}
          >
            <div>
              <strong>
                {item.title}
              </strong>

              <span>
                {item.description}
              </span>
            </div>

            <Toggle
              label={item.title}
              checked={
                settings.technical[
                  item.key
                ]
              }
              onChange={(checked) =>
                setSettings(
                  (current) => ({
                    ...current,
                    technical: {
                      ...current.technical,
                      [item.key]: checked,
                    },
                  }),
                )
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
