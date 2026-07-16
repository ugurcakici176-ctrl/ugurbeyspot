"use client";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
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
  DEFAULT_SITE_SETTINGS,
} from "@/lib/default-content";
import {
  DEFAULT_GLOBAL_SITE_SETTINGS,
  getGlobalSiteSettings,
  saveGlobalSiteSettings,
  type GlobalSiteSettings,
  type GtmConsentCategory,
} from "@/lib/global-site-settings";
import {
  getSiteSettings,
  saveSiteSettings,
} from "@/lib/site-content";
import type {
  SiteSettings,
  SocialLink,
  SocialPlatform,
  WorkingHour,
} from "@/lib/types";
import {
  deepClone,
} from "@/lib/utils";
type SettingsTab =
  | "overview"
  | "branding"
  | "contact"
  | "announcement"
  | "integrations"
  | "maintenance"
  | "technical";
interface GoogleAdsSettings {
  enabled: boolean;
  conversionId: string;
  conversionLabel: string;
}
type ExtendedGlobalSettings =
  GlobalSiteSettings & {
    integrations:
      GlobalSiteSettings["integrations"] & {
        googleAds: GoogleAdsSettings;
      };
  };
interface TabItem {
  key: SettingsTab;
  label: string;
  description: string;
  icon: string;
}
const TABS: readonly TabItem[] = [
  {
    key: "overview",
    label: "Genel",
    description: "Sistem özeti",
    icon: "grid",
  },
  {
    key: "branding",
    label: "Marka & Logo",
    description: "Kurumsal kimlik",
    icon: "image",
  },
  {
    key: "contact",
    label: "İletişim",
    description: "Mağaza ve sosyal",
    icon: "message-circle",
  },
  {
    key: "announcement",
    label: "Header & Footer",
    description: "Üst-alt alanlar",
    icon: "sparkles",
  },
  {
    key: "integrations",
    label: "Ölçüm & Reklam",
    description: "GA4, GTM, Ads, Pixel",
    icon: "search",
  },
  {
    key: "maintenance",
    label: "Bakım Modu",
    description: "Erişim kontrolü",
    icon: "settings",
  },
  {
    key: "technical",
    label: "Teknik",
    description: "Site davranışları",
    icon: "shield-check",
  },
];
const SOCIAL_PLATFORMS: readonly {
  key: SocialPlatform;
  label: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
  },
  {
    key: "facebook",
    label: "Facebook",
  },
  {
    key: "tiktok",
    label: "TikTok",
  },
  {
    key: "youtube",
    label: "YouTube",
  },
  {
    key: "x",
    label: "X / Twitter",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
  },
];
function cloneGlobalSettings(
  value: GlobalSiteSettings,
): ExtendedGlobalSettings {
  const cloned = JSON.parse(
    JSON.stringify(value),
  ) as ExtendedGlobalSettings;
  return {
    ...cloned,
    integrations: {
      ...cloned.integrations,
      googleAds: cloned.integrations
        .googleAds || {
        enabled: false,
        conversionId: "",
        conversionLabel: "",
      },
    },
  };
}
function createId(
  prefix: string,
): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 8),
  ].join("-");
}
function Switch({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (
    checked: boolean,
  ) => void;
}) {
  return (
    <div className="settings-switch-row">
      <div>
        <strong>
          {label}
        </strong>
        {description && (
          <span>
            {description}
          </span>
        )}
      </div>
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
    </div>
  );
}
function StatusBadge({
  active,
  activeText = "Aktif",
  passiveText = "Pasif",
}: {
  active: boolean;
  activeText?: string;
  passiveText?: string;
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
        ? activeText
        : passiveText}
    </span>
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
  children?: ReactNode;
}) {
  return (
    <div className="control-panel__heading">
      <div>
        <span>
          {eyebrow}
        </span>
        <h2>
          {title}
        </h2>
        <p>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
export default function SettingsAdminClient() {
  const [
    settings,
    setSettings,
  ] = useState<SiteSettings>(
    () =>
      deepClone(
        DEFAULT_SITE_SETTINGS,
      ),
  );
  const [
    globalSettings,
    setGlobalSettings,
  ] =
    useState<ExtendedGlobalSettings>(
      () =>
        cloneGlobalSettings(
          DEFAULT_GLOBAL_SITE_SETTINGS,
        ),
    );
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<SettingsTab>(
      "overview",
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
  useEffect(() => {
    let active = true;
    async function loadSettings():
      Promise<void> {
      setLoading(true);
      try {
        const [
          siteData,
          globalData,
        ] = await Promise.all([
          getSiteSettings(),
          getGlobalSiteSettings(
            true,
          ),
        ]);
        if (!active) {
          return;
        }
        setSettings(
          deepClone(siteData),
        );
        setGlobalSettings(
          cloneGlobalSettings(
            globalData,
          ),
        );
      } catch (reason: unknown) {
        console.error(
          "Settings load error:",
          reason,
        );
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Site ayarları yüklenemedi.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadSettings();
    return () => {
      active = false;
    };
  }, []);
  const activeIntegrationCount =
    useMemo(
      () =>
        [
          globalSettings
            .integrations
            .ga4.enabled,
          globalSettings
            .integrations
            .gtm.enabled,
          globalSettings
            .integrations
            .googleAds
            .enabled,
          globalSettings
            .integrations
            .metaPixel
            .enabled,
        ].filter(Boolean).length,
      [globalSettings],
    );
  const activeSocialCount =
    useMemo(
      () =>
        settings.contact.socialLinks
          .filter(
            (item) =>
              item.status ===
                "active" &&
              item.url.trim(),
          ).length,
      [
        settings.contact
          .socialLinks,
      ],
    );
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
    clearMessages();
    setUploadingLogo(true);
    const previousPath =
      globalSettings
        .branding
        .logoStoragePath;
    try {
      const result =
        await uploadBrandLogo(
          file,
        );
      setGlobalSettings(
        (current) => ({
          ...current,
          branding: {
            ...current.branding,
            logoMode:
              "image",
            logoUrl:
              result.url,
            logoStoragePath:
              result.path,
          },
        }),
      );
      if (
        previousPath &&
        previousPath !==
          result.path
      ) {
        await deleteBrandAsset(
          previousPath,
        );
      }
      setMessage(
        "Logo başarıyla yüklendi. Ayarları Kaydet butonuna basarak yayına alın.",
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
  function updateSocialLink(
    platform: SocialPlatform,
    field:
      | "url"
      | "status",
    value: string,
  ): void {
    setSettings(
      (current) => {
        const existing =
          current.contact
            .socialLinks
            .find(
              (item) =>
                item.platform ===
                platform,
            );
        let nextLinks:
          SocialLink[];
        if (existing) {
          nextLinks =
            current.contact
              .socialLinks
              .map(
                (item) =>
                  item.platform ===
                  platform
                    ? {
                        ...item,
                        [field]:
                          value,
                      }
                    : item,
              );
        } else {
          nextLinks = [
            ...current.contact
              .socialLinks,
            {
              platform,
              label:
                SOCIAL_PLATFORMS
                  .find(
                    (item) =>
                      item.key ===
                      platform,
                  )
                  ?.label ||
                platform,
              url:
                field === "url"
                  ? value
                  : "",
              status:
                field === "status"
                  ? value as
                      | "active"
                      | "passive"
                  : "active",
            },
          ];
        }
        return {
          ...current,
          contact: {
            ...current.contact,
            socialLinks:
              nextLinks,
          },
        };
      },
    );
  }
  function getSocialLink(
    platform: SocialPlatform,
  ): SocialLink {
    return (
      settings.contact
        .socialLinks
        .find(
          (item) =>
            item.platform ===
            platform,
        ) || {
        platform,
        label: platform,
        url: "",
        status: "passive",
      }
    );
  }
  function addWorkingHour(): void {
    setSettings(
      (current) => ({
        ...current,
        contact: {
          ...current.contact,
          workingHours: [
            ...current.contact
              .workingHours,
            {
              id:
                createId(
                  "hours",
                ),
              dayLabel:
                "Yeni Gün",
              openingTime:
                "09:00",
              closingTime:
                "18:00",
              isClosed: false,
              sortOrder:
                current.contact
                  .workingHours
                  .length,
            },
          ],
        },
      }),
    );
  }
  function updateWorkingHour(
    id: string,
    field:
      keyof WorkingHour,
    value:
      | string
      | number
      | boolean,
  ): void {
    setSettings(
      (current) => ({
        ...current,
        contact: {
          ...current.contact,
          workingHours:
            current.contact
              .workingHours
              .map(
                (item) =>
                  item.id === id
                    ? {
                        ...item,
                        [field]:
                          value,
                      }
                    : item,
              ),
        },
      }),
    );
  }
  function deleteWorkingHour(
    id: string,
  ): void {
    setSettings(
      (current) => ({
        ...current,
        contact: {
          ...current.contact,
          workingHours:
            current.contact
              .workingHours
              .filter(
                (item) =>
                  item.id !== id,
              ),
        },
      }),
    );
  }
  function addFooterLegalLink(): void {
    setSettings(
      (current) => ({
        ...current,
        footer: {
          ...current.footer,
          legalLinks: [
            ...current.footer
              .legalLinks,
            {
              id:
                createId(
                  "legal",
                ),
              label: "",
              href: "",
            },
          ],
        },
      }),
    );
  }
  function updateFooterLegalLink(
    id: string,
    field:
      | "label"
      | "href",
    value: string,
  ): void {
    setSettings(
      (current) => ({
        ...current,
        footer: {
          ...current.footer,
          legalLinks:
            current.footer
              .legalLinks
              .map(
                (item) =>
                  item.id === id
                    ? {
                        ...item,
                        [field]:
                          value,
                      }
                    : item,
              ),
        },
      }),
    );
  }
  function deleteFooterLegalLink(
    id: string,
  ): void {
    setSettings(
      (current) => ({
        ...current,
        footer: {
          ...current.footer,
          legalLinks:
            current.footer
              .legalLinks
              .filter(
                (item) =>
                  item.id !== id,
              ),
        },
      }),
    );
  }
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (
      saving ||
      uploadingLogo
    ) {
      return;
    }
    clearMessages();
    setSaving(true);
    try {
      const normalizedSite:
        SiteSettings = {
        ...settings,
        branding: {
          ...settings.branding,
          siteName:
            settings.branding
              .siteName
              .trim(),
          shortName:
            settings.branding
              .shortName
              .trim(),
          slogan:
            settings.branding
              .slogan
              .trim(),
        },
        header: {
          ...settings.header,
          navLabels: {
            home:
              settings.header
                .navLabels.home
                .trim(),
            about:
              settings.header
                .navLabels.about
                .trim(),
            products:
              settings.header
                .navLabels
                .products
                .trim(),
            contact:
              settings.header
                .navLabels
                .contact
                .trim(),
          },
          primaryCtaLabel:
            settings.header
              .primaryCtaLabel
              .trim(),
          primaryCtaHref:
            settings.header
              .primaryCtaHref
              .trim(),
        },
        contact: {
          ...settings.contact,
          phone:
            settings.contact
              .phone
              .trim(),
          whatsapp:
            settings.contact
              .whatsapp
              .trim(),
          email:
            settings.contact
              .email
              .trim(),
          address:
            settings.contact
              .address
              .trim(),
          city:
            settings.contact
              .city
              .trim(),
          district:
            settings.contact
              .district
              .trim(),
          googleMapsUrl:
            settings.contact
              .googleMapsUrl
              .trim(),
          socialLinks:
            settings.contact
              .socialLinks
              .map(
                (item) => ({
                  ...item,
                  url:
                    item.url.trim(),
                }),
              ),
          workingHours:
            settings.contact
              .workingHours
              .map(
                (
                  item,
                  index,
                ) => ({
                  ...item,
                  dayLabel:
                    item.dayLabel
                      .trim(),
                  sortOrder:
                    index,
                }),
              ),
        },
        footer: {
          ...settings.footer,
          quickLinksTitle:
            settings.footer
              .quickLinksTitle
              .trim(),
          contactTitle:
            settings.footer
              .contactTitle
              .trim(),
          storeTitle:
            settings.footer
              .storeTitle
              .trim(),
          description:
            settings.footer
              .description
              .trim(),
          copyrightText:
            settings.footer
              .copyrightText
              .trim(),
          bottomNote:
            settings.footer
              .bottomNote
              .trim(),
          legalLinks:
            settings.footer
              .legalLinks
              .map(
                (item) => ({
                  ...item,
                  label:
                    item.label.trim(),
                  href:
                    item.href.trim(),
                }),
              )
              .filter(
                (item) =>
                  item.label &&
                  item.href,
              ),
        },
      };
      const normalizedGlobal:
        ExtendedGlobalSettings = {
        ...globalSettings,
        branding: {
          ...globalSettings
            .branding,
          siteName:
            normalizedSite
              .branding
              .siteName,
          slogan:
            normalizedSite
              .branding
              .slogan,
          monogram:
            globalSettings
              .branding
              .monogram
              .trim()
              .slice(0, 4)
              .toUpperCase(),
          logoAlt:
            globalSettings
              .branding
              .logoAlt
              .trim(),
        },
        business: {
          ...globalSettings
            .business,
          phone:
            normalizedSite
              .contact.phone,
          email:
            normalizedSite
              .contact.email,
          whatsapp:
            normalizedSite
              .contact
              .whatsapp,
          address:
            normalizedSite
              .contact.address,
          mapsUrl:
            normalizedSite
              .contact
              .googleMapsUrl,
        },
        integrations: {
          ...globalSettings
            .integrations,
          ga4: {
            ...globalSettings
              .integrations.ga4,
            measurementId:
              globalSettings
                .integrations
                .ga4
                .measurementId
                .trim()
                .toUpperCase(),
          },
          gtm: {
            ...globalSettings
              .integrations.gtm,
            containerId:
              globalSettings
                .integrations
                .gtm
                .containerId
                .trim()
                .toUpperCase(),
          },
          googleAds: {
            ...globalSettings
              .integrations
              .googleAds,
            conversionId:
              globalSettings
                .integrations
                .googleAds
                .conversionId
                .trim()
                .toUpperCase(),
            conversionLabel:
              globalSettings
                .integrations
                .googleAds
                .conversionLabel
                .trim(),
          },
          metaPixel: {
            ...globalSettings
              .integrations
              .metaPixel,
            pixelId:
              globalSettings
                .integrations
                .metaPixel
                .pixelId
                .trim(),
          },
        },
        updatedAt:
          new Date()
            .toISOString(),
      };
      await Promise.all([
        saveSiteSettings(
          normalizedSite,
        ),
        saveGlobalSiteSettings(
          normalizedGlobal,
        ),
      ]);
      setSettings(
        deepClone(
          normalizedSite,
        ),
      );
      setGlobalSettings(
        cloneGlobalSettings(
          normalizedGlobal,
        ),
      );
      setMessage(
        "Tüm site ayarları başarıyla kaydedildi ve kontrol merkezi güncellendi.",
      );
    } catch (reason: unknown) {
      console.error(
        "Settings save error:",
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
        Gelişmiş site ayarları hazırlanıyor...
      </div>
    );
  }
  return (
    <>
      <AdminPageHeading
        eyebrow="SITE CONTROL CENTER"
        title="Site Ayarları"
        description="Marka kimliği, header-footer alanları, iletişim, duyuru, GA4, Tag Manager, Google Ads, Meta Pixel, bakım modu ve teknik site davranışlarını tek merkezden yönetin."
      />
      <form
        className="control-center"
        onSubmit={handleSubmit}
      >
        <section className="control-overview">
          <article className="control-overview__hero">
            <div>
              <span>
                UĞUR BEY SPOT CONTROL
              </span>
              <h2>
                Tüm site.
                <br />
                Tek merkez.
              </h2>
              <p>
                İçerik ayarlarından ölçüm sistemlerine kadar sitenin kritik yönetim katmanı tek kontrol panelinde.
              </p>
            </div>
            <div className="control-overview__mark">
              {globalSettings
                .branding
                .monogram ||
                "UB"}
            </div>
          </article>
          <article className="control-stat-card">
            <span>
              SITE STATUS
            </span>
            <strong>
              {globalSettings
                .maintenance
                .enabled
                ? "Bakımda"
                : "Yayında"}
            </strong>
            <StatusBadge
              active={
                !globalSettings
                  .maintenance
                  .enabled
              }
              activeText="Online"
              passiveText="Bakım"
            />
          </article>
          <article className="control-stat-card">
            <span>
              TRACKING
            </span>
            <strong>
              {activeIntegrationCount}
              /4
            </strong>
            <small>
              Aktif ölçüm ve reklam bağlantısı
            </small>
          </article>
          <article className="control-stat-card">
            <span>
              SOCIAL
            </span>
            <strong>
              {activeSocialCount}
              /6
            </strong>
            <small>
              Aktif sosyal medya bağlantısı
            </small>
          </article>
        </section>
        <div className="control-layout">
          <aside className="control-tabs">
            <span className="control-tabs__label">
              AYAR GRUPLARI
            </span>
            {TABS.map(
              (tab) => (
                <button
                  type="button"
                  key={tab.key}
                  className={
                    activeTab ===
                    tab.key
                      ? "is-active"
                      : undefined
                  }
                  onClick={() => {
                    clearMessages();
                    setActiveTab(
                      tab.key,
                    );
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
                      {
                        tab.description
                      }
                    </small>
                  </span>
                  <Icon
                    name="arrow-right"
                    size={15}
                  />
                </button>
              ),
            )}
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
            {activeTab ===
              "overview" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="GENEL BAKIŞ"
                  title="Site Yönetim Merkezi"
                  description="Site üzerindeki kritik sistemleri tek bakışta kontrol edin."
                />
                <div className="control-quick-grid">
                  {TABS
                    .filter(
                      (tab) =>
                        tab.key !==
                        "overview",
                    )
                    .map(
                      (tab) => (
                        <button
                          type="button"
                          className="control-quick-card"
                          key={tab.key}
                          onClick={() =>
                            setActiveTab(
                              tab.key,
                            )
                          }
                        >
                          <Icon
                            name={
                              tab.icon
                            }
                            size={23}
                          />
                          <strong>
                            {
                              tab.label
                            }
                          </strong>
                          <span>
                            {
                              tab.description
                            }
                          </span>
                          <Icon
                            name="arrow-right"
                            size={17}
                          />
                        </button>
                      ),
                    )}
                </div>
                <div className="control-health">
                  <div className="control-health__heading">
                    <span>
                      SYSTEM HEALTH
                    </span>
                    <strong>
                      Bağlantı ve servis durumu
                    </strong>
                  </div>
                  {[
                    {
                      label:
                        "Google Analytics 4",
                      value:
                        globalSettings
                          .integrations
                          .ga4
                          .measurementId ||
                        "Measurement ID girilmedi",
                      active:
                        globalSettings
                          .integrations
                          .ga4.enabled,
                    },
                    {
                      label:
                        "Google Tag Manager",
                      value:
                        globalSettings
                          .integrations
                          .gtm
                          .containerId ||
                        "Container ID girilmedi",
                      active:
                        globalSettings
                          .integrations
                          .gtm.enabled,
                    },
                    {
                      label:
                        "Google Ads",
                      value:
                        globalSettings
                          .integrations
                          .googleAds
                          .conversionId ||
                        "Conversion ID girilmedi",
                      active:
                        globalSettings
                          .integrations
                          .googleAds
                          .enabled,
                    },
                    {
                      label:
                        "Meta Pixel",
                      value:
                        globalSettings
                          .integrations
                          .metaPixel
                          .pixelId ||
                        "Pixel ID girilmedi",
                      active:
                        globalSettings
                          .integrations
                          .metaPixel
                          .enabled,
                    },
                  ].map(
                    (item) => (
                      <div
                        className="control-health__row"
                        key={
                          item.label
                        }
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
                            {
                              item.label
                            }
                          </strong>
                          <small>
                            {
                              item.value
                            }
                          </small>
                        </div>
                        <StatusBadge
                          active={
                            item.active
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
            {activeTab ===
              "branding" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="BRAND SYSTEM"
                  title="Marka ve Logo Yönetimi"
                  description="Sitenin kurumsal kimliğini, logo kullanımını ve temel marka metinlerini yönetin."
                />
                <div className="brand-control-grid">
                  <div className="brand-preview">
                    <span className="brand-preview__label">
                      CANLI ÖNİZLEME
                    </span>
                    <div className="brand-preview__logo">
                      {globalSettings
                        .branding
                        .logoMode ===
                        "image" &&
                      globalSettings
                        .branding
                        .logoUrl ? (
                        <img
                          src={
                            globalSettings
                              .branding
                              .logoUrl
                          }
                          alt={
                            globalSettings
                              .branding
                              .logoAlt
                          }
                        />
                      ) : (
                        <span>
                          {globalSettings
                            .branding
                            .monogram ||
                            "UB"}
                        </span>
                      )}
                    </div>
                    <strong>
                      {
                        settings
                          .branding
                          .siteName
                      }
                    </strong>
                    <small>
                      {
                        settings
                          .branding
                          .slogan
                      }
                    </small>
                  </div>
                  <div className="control-fields">
                    <div className="control-choice-row">
                      <button
                        type="button"
                        className={
                          globalSettings
                            .branding
                            .logoMode ===
                          "monogram"
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              branding: {
                                ...current
                                  .branding,
                                logoMode:
                                  "monogram",
                              },
                            }),
                          )
                        }
                      >
                        Monogram
                      </button>
                      <button
                        type="button"
                        className={
                          globalSettings
                            .branding
                            .logoMode ===
                          "image"
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              branding: {
                                ...current
                                  .branding,
                                logoMode:
                                  "image",
                              },
                            }),
                          )
                        }
                      >
                        Görsel Logo
                      </button>
                    </div>
                    <label className="admin-field">
                      <span>
                        Site Adı
                      </span>
                      <input
                        value={
                          settings
                            .branding
                            .siteName
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              branding: {
                                ...current
                                  .branding,
                                siteName:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <div className="admin-two-columns">
                      <label className="admin-field">
                        <span>
                          Kısa Ad
                        </span>
                        <input
                          value={
                            settings
                              .branding
                              .shortName
                          }
                          onChange={(
                            event,
                          ) =>
                            setSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                branding: {
                                  ...current
                                    .branding,
                                  shortName:
                                    event
                                      .target
                                      .value,
                                },
                              }),
                            )
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span>
                          Monogram
                        </span>
                        <input
                          maxLength={4}
                          value={
                            globalSettings
                              .branding
                              .monogram
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                branding: {
                                  ...current
                                    .branding,
                                  monogram:
                                    event
                                      .target
                                      .value,
                                },
                              }),
                            )
                          }
                        />
                      </label>
                    </div>
                    <label className="admin-field">
                      <span>
                        Slogan
                      </span>
                      <input
                        value={
                          settings
                            .branding
                            .slogan
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              branding: {
                                ...current
                                  .branding,
                                slogan:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <div className="admin-two-columns">
                      <label className="admin-field">
                        <span>
                          Logo Alt Metni
                        </span>
                        <input
                          value={
                            globalSettings
                              .branding
                              .logoAlt
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                branding: {
                                  ...current
                                    .branding,
                                  logoAlt:
                                    event
                                      .target
                                      .value,
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
                            globalSettings
                              .branding
                              .accentColor
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                branding: {
                                  ...current
                                    .branding,
                                  accentColor:
                                    event
                                      .target
                                      .value,
                                },
                              }),
                            )
                          }
                        />
                      </label>
                    </div>
                    <label className="brand-upload">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(
                          event,
                        ) =>
                          void handleLogoUpload(
                            event,
                          )
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
            )}
            {activeTab ===
              "contact" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="BUSINESS DATA"
                  title="İletişim ve Mağaza Bilgileri"
                  description="Müşterilerin göreceği mağaza iletişim, adres, sosyal medya ve çalışma saati bilgilerini yönetin."
                />
                <div className="control-fields">
                  <div className="admin-two-columns">
                    <label className="admin-field">
                      <span>
                        Telefon
                      </span>
                      <input
                        value={
                          settings
                            .contact
                            .phone
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                phone:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>
                        WhatsApp
                      </span>
                      <input
                        placeholder="905xxxxxxxxx veya wa.me/905xxxxxxxxx"
                        value={
                          settings
                            .contact
                            .whatsapp
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                whatsapp:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="admin-field">
                    <span>
                      E-posta
                    </span>
                    <input
                      type="email"
                      value={
                        settings
                          .contact
                          .email
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            contact: {
                              ...current
                                .contact,
                              email:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Açık Adres
                    </span>
                    <textarea
                      rows={4}
                      value={
                        settings
                          .contact
                          .address
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            contact: {
                              ...current
                                .contact,
                              address:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="admin-two-columns">
                    <label className="admin-field">
                      <span>
                        İlçe
                      </span>
                      <input
                        value={
                          settings
                            .contact
                            .district
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                district:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>
                        Şehir
                      </span>
                      <input
                        value={
                          settings
                            .contact
                            .city
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                city:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="admin-two-columns">
                    <label className="admin-field">
                      <span>
                        Posta Kodu
                      </span>
                      <input
                        value={
                          settings
                            .contact
                            .postalCode ||
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                postalCode:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>
                        Google Maps URL
                      </span>
                      <input
                        value={
                          settings
                            .contact
                            .googleMapsUrl
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              contact: {
                                ...current
                                  .contact,
                                googleMapsUrl:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="admin-field">
                    <span>
                      Google Maps Embed URL
                    </span>
                    <input
                      value={
                        settings
                          .contact
                          .googleMapsEmbedUrl ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            contact: {
                              ...current
                                .contact,
                              googleMapsEmbedUrl:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="control-divider">
                    SOSYAL MEDYA
                  </div>
                  <div className="settings-social-grid">
                    {SOCIAL_PLATFORMS.map(
                      (
                        platform,
                      ) => {
                        const link =
                          getSocialLink(
                            platform.key,
                          );
                        return (
                          <article
                            className="settings-social-card"
                            key={
                              platform.key
                            }
                          >
                            <div>
                              <strong>
                                {
                                  platform.label
                                }
                              </strong>
                              <StatusBadge
                                active={
                                  link.status ===
                                  "active"
                                }
                              />
                            </div>
                            <input
                              placeholder={`${platform.label} URL`}
                              value={
                                link.url
                              }
                              onChange={(
                                event,
                              ) =>
                                updateSocialLink(
                                  platform.key,
                                  "url",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                            <Switch
                              label={`${platform.label} bağlantısını göster`}
                              checked={
                                link.status ===
                                "active"
                              }
                              onChange={(
                                checked,
                              ) =>
                                updateSocialLink(
                                  platform.key,
                                  "status",
                                  checked
                                    ? "active"
                                    : "passive",
                                )
                              }
                            />
                          </article>
                        );
                      },
                    )}
                  </div>
                  <div className="control-divider">
                    ÇALIŞMA SAATLERİ
                  </div>
                  <div className="settings-hours">
                    {[
                      ...settings
                        .contact
                        .workingHours,
                    ]
                      .sort(
                        (
                          a,
                          b,
                        ) =>
                          a.sortOrder -
                          b.sortOrder,
                      )
                      .map(
                        (
                          item,
                          index,
                        ) => (
                          <article
                            className="settings-hours__row"
                            key={
                              item.id
                            }
                          >
                            <span>
                              {String(
                                index + 1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>
                            <input
                              value={
                                item.dayLabel
                              }
                              onChange={(
                                event,
                              ) =>
                                updateWorkingHour(
                                  item.id,
                                  "dayLabel",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                            <input
                              type="time"
                              disabled={
                                item.isClosed
                              }
                              value={
                                item.openingTime ||
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateWorkingHour(
                                  item.id,
                                  "openingTime",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                            <input
                              type="time"
                              disabled={
                                item.isClosed
                              }
                              value={
                                item.closingTime ||
                                ""
                              }
                              onChange={(
                                event,
                              ) =>
                                updateWorkingHour(
                                  item.id,
                                  "closingTime",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                            <button
                              type="button"
                              className={
                                item.isClosed
                                  ? "is-active"
                                  : ""
                              }
                              onClick={() =>
                                updateWorkingHour(
                                  item.id,
                                  "isClosed",
                                  !item.isClosed,
                                )
                              }
                            >
                              {item.isClosed
                                ? "Kapalı"
                                : "Açık"}
                            </button>
                            <button
                              type="button"
                              aria-label="Çalışma saatini sil"
                              onClick={() =>
                                deleteWorkingHour(
                                  item.id,
                                )
                              }
                            >
                              <Icon
                                name="trash"
                                size={17}
                              />
                            </button>
                          </article>
                        ),
                      )}
                  </div>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={
                      addWorkingHour
                    }
                  >
                    <Icon
                      name="plus"
                      size={17}
                    />
                    Çalışma Günü Ekle
                  </button>
                </div>
              </section>
            )}
            {activeTab ===
              "announcement" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="HEADER & FOOTER"
                  title="Üst ve Alt Alan Yönetimi"
                  description="Header navigasyonu, hızlı aksiyon butonu, duyuru bandı ve footer içeriklerini gelişmiş biçimde yönetin."
                />
                <div className="control-fields">
                  <div className="control-divider">
                    HEADER
                  </div>
                  <Switch
                    checked={
                      settings
                        .header
                        .showAuthButtons
                    }
                    label="Üye giriş / kayıt butonlarını göster"
                    description="Header sağ alandaki giriş ve kayıt butonlarını yönetir."
                    onChange={(
                      checked,
                    ) =>
                      setSettings(
                        (
                          current,
                        ) => ({
                          ...current,
                          header: {
                            ...current
                              .header,
                            showAuthButtons:
                              checked,
                          },
                        }),
                      )
                    }
                  />
                  <label className="admin-field">
                    <span>
                      Header Aksiyon Butonu Metni
                    </span>
                    <input
                      placeholder="Hızlı Teklif"
                      value={
                        settings
                          .header
                          .primaryCtaLabel
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            header: {
                              ...current
                                .header,
                              primaryCtaLabel:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Header Aksiyon Butonu Linki
                    </span>
                    <input
                      placeholder="/iletisim veya https://..."
                      value={
                        settings
                          .header
                          .primaryCtaHref
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            header: {
                              ...current
                                .header,
                              primaryCtaHref:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="settings-hours">
                    <article className="settings-hours__row">
                      <span>
                        01
                      </span>
                      <input
                        value={
                          settings
                            .header
                            .navLabels.home
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              header: {
                                ...current
                                  .header,
                                navLabels: {
                                  ...current
                                    .header
                                    .navLabels,
                                  home: event
                                    .target
                                    .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                      <input
                        value="/"
                        disabled
                      />
                    </article>
                    <article className="settings-hours__row">
                      <span>
                        02
                      </span>
                      <input
                        value={
                          settings
                            .header
                            .navLabels
                            .about
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              header: {
                                ...current
                                  .header,
                                navLabels: {
                                  ...current
                                    .header
                                    .navLabels,
                                  about:
                                    event
                                      .target
                                      .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                      <input
                        value="/hakkimizda"
                        disabled
                      />
                    </article>
                    <article className="settings-hours__row">
                      <span>
                        03
                      </span>
                      <input
                        value={
                          settings
                            .header
                            .navLabels
                            .products
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              header: {
                                ...current
                                  .header,
                                navLabels: {
                                  ...current
                                    .header
                                    .navLabels,
                                  products:
                                    event
                                      .target
                                      .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                      <input
                        value="/urunler"
                        disabled
                      />
                    </article>
                    <article className="settings-hours__row">
                      <span>
                        04
                      </span>
                      <input
                        value={
                          settings
                            .header
                            .navLabels
                            .contact
                        }
                        onChange={(
                          event,
                        ) =>
                          setSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              header: {
                                ...current
                                  .header,
                                navLabels: {
                                  ...current
                                    .header
                                    .navLabels,
                                  contact:
                                    event
                                      .target
                                      .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                      <input
                        value="/iletisim"
                        disabled
                      />
                    </article>
                  </div>

                  <div className="control-divider">
                    DUYURU BANDI
                  </div>
                  <Switch
                    checked={
                      settings
                        .announcement
                        .status ===
                      "active"
                    }
                    label="Duyuru bandını göster"
                    description="Sitenin üst kısmındaki global duyuru alanını aktif eder."
                    onChange={(
                      checked,
                    ) =>
                      setSettings(
                        (
                          current,
                        ) => ({
                          ...current,
                          announcement: {
                            ...current
                              .announcement,
                            status:
                              checked
                                ? "active"
                                : "passive",
                          },
                        }),
                      )
                    }
                  />
                  <label className="admin-field">
                    <span>
                      Duyuru Metni
                    </span>
                    <input
                      value={
                        settings
                          .announcement
                          .text
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            announcement: {
                              ...current
                                .announcement,
                              text:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Duyuru Linki
                    </span>
                    <input
                      placeholder="/urunler veya https://..."
                      value={
                        settings
                          .announcement
                          .href ||
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            announcement: {
                              ...current
                                .announcement,
                              href:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="control-divider">
                    FOOTER
                  </div>
                  <label className="admin-field">
                    <span>
                      Hızlı Linkler Başlığı
                    </span>
                    <input
                      value={
                        settings
                          .footer
                          .quickLinksTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              quickLinksTitle:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      İletişim Başlığı
                    </span>
                    <input
                      value={
                        settings
                          .footer
                          .contactTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              contactTitle:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Mağaza Başlığı
                    </span>
                    <input
                      value={
                        settings
                          .footer
                          .storeTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              storeTitle:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Footer Açıklaması
                    </span>
                    <textarea
                      rows={6}
                      value={
                        settings
                          .footer
                          .description
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              description:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Telif Metni
                    </span>
                    <input
                      value={
                        settings
                          .footer
                          .copyrightText
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              copyrightText:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Alt Not Metni
                    </span>
                    <input
                      value={
                        settings
                          .footer
                          .bottomNote
                      }
                      onChange={(
                        event,
                      ) =>
                        setSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            footer: {
                              ...current
                                .footer,
                              bottomNote:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="control-divider">
                    YASAL LİNKLER
                  </div>
                  <div className="settings-hours">
                    {settings.footer.legalLinks.map(
                      (
                        item,
                        index,
                      ) => (
                        <article
                          key={item.id}
                          className="settings-hours__row"
                        >
                          <span>
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>
                          <input
                            placeholder="Link başlığı"
                            value={
                              item.label
                            }
                            onChange={(
                              event,
                            ) =>
                              updateFooterLegalLink(
                                item.id,
                                "label",
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                          <input
                            placeholder="/kvkk-aydinlatma-metni"
                            value={
                              item.href
                            }
                            onChange={(
                              event,
                            ) =>
                              updateFooterLegalLink(
                                item.id,
                                "href",
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                          <button
                            type="button"
                            aria-label="Yasal linki sil"
                            onClick={() =>
                              deleteFooterLegalLink(
                                item.id,
                              )
                            }
                          >
                            <Icon
                              name="trash"
                              size={17}
                            />
                          </button>
                        </article>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={
                      addFooterLegalLink
                    }
                  >
                    <Icon
                      name="plus"
                      size={17}
                    />
                    Yasal Link Ekle
                  </button>
                </div>
              </section>
            )}
            {activeTab ===
              "integrations" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="DATA & AD SYSTEMS"
                  title="Analitik, Tag ve Reklam Bağlantıları"
                  description="Google Analytics 4, Google Tag Manager, Google Ads ve Meta Pixel bağlantılarını tek merkezden yönetin."
                >
                  <StatusBadge
                    active={
                      activeIntegrationCount >
                      0
                    }
                    activeText={`${activeIntegrationCount}/4 aktif`}
                    passiveText="Bağlantı yok"
                  />
                </PanelHeading>
                <div className="integration-stack">
                  <article className="integration-card">
                    <div className="integration-card__top">
                      <span className="integration-logo">
                        GA
                      </span>
                      <div>
                        <strong>
                          Google Analytics 4
                        </strong>
                        <small>
                          Trafik, kullanıcı ve sayfa ölçümü
                        </small>
                      </div>
                      <StatusBadge
                        active={
                          globalSettings
                            .integrations
                            .ga4
                            .enabled
                        }
                      />
                      <button
                        type="button"
                        className={
                          `control-toggle ${
                            globalSettings
                              .integrations
                              .ga4
                              .enabled
                              ? "is-active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                ga4: {
                                  ...current
                                    .integrations
                                    .ga4,
                                  enabled:
                                    !current
                                      .integrations
                                      .ga4
                                      .enabled,
                                },
                              },
                            }),
                          )
                        }
                      >
                        <span />
                      </button>
                    </div>
                    <label className="admin-field">
                      <span>
                        Measurement ID
                      </span>
                      <input
                        placeholder="G-XXXXXXXXXX"
                        value={
                          globalSettings
                            .integrations
                            .ga4
                            .measurementId
                        }
                        onChange={(
                          event,
                        ) =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                ga4: {
                                  ...current
                                    .integrations
                                    .ga4,
                                  measurementId:
                                    event
                                      .target
                                      .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <p className="integration-card__note">
                      Analitik çerez izni verildiğinde runtime üzerinden yüklenir.
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
                          Merkezi tag ve event yönetimi
                        </small>
                      </div>
                      <StatusBadge
                        active={
                          globalSettings
                            .integrations
                            .gtm
                            .enabled
                        }
                      />
                      <button
                        type="button"
                        className={
                          `control-toggle ${
                            globalSettings
                              .integrations
                              .gtm
                              .enabled
                              ? "is-active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                gtm: {
                                  ...current
                                    .integrations
                                    .gtm,
                                  enabled:
                                    !current
                                      .integrations
                                      .gtm
                                      .enabled,
                                },
                              },
                            }),
                          )
                        }
                      >
                        <span />
                      </button>
                    </div>
                    <div className="admin-two-columns">
                      <label className="admin-field">
                        <span>
                          Container ID
                        </span>
                        <input
                          placeholder="GTM-XXXXXXX"
                          value={
                            globalSettings
                              .integrations
                              .gtm
                              .containerId
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                integrations: {
                                  ...current
                                    .integrations,
                                  gtm: {
                                    ...current
                                      .integrations
                                      .gtm,
                                    containerId:
                                      event
                                        .target
                                        .value,
                                  },
                                },
                              }),
                            )
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span>
                          Çerez İzin Kategorisi
                        </span>
                        <select
                          value={
                            globalSettings
                              .integrations
                              .gtm
                              .consentCategory
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                integrations: {
                                  ...current
                                    .integrations,
                                  gtm: {
                                    ...current
                                      .integrations
                                      .gtm,
                                    consentCategory:
                                      event
                                        .target
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
                      GTM içinde GA4 etiketi aktifse doğrudan GA4 bağlantısını ayrıca kullanmak çift page_view oluşturabilir.
                    </p>
                  </article>
                  <article className="integration-card">
                    <div className="integration-card__top">
                      <span className="integration-logo">
                        ADS
                      </span>
                      <div>
                        <strong>
                          Google Ads
                        </strong>
                        <small>
                          Reklam dönüşüm bağlantısı
                        </small>
                      </div>
                      <StatusBadge
                        active={
                          globalSettings
                            .integrations
                            .googleAds
                            .enabled
                        }
                      />
                      <button
                        type="button"
                        className={
                          `control-toggle ${
                            globalSettings
                              .integrations
                              .googleAds
                              .enabled
                              ? "is-active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                googleAds: {
                                  ...current
                                    .integrations
                                    .googleAds,
                                  enabled:
                                    !current
                                      .integrations
                                      .googleAds
                                      .enabled,
                                },
                              },
                            }),
                          )
                        }
                      >
                        <span />
                      </button>
                    </div>
                    <div className="admin-two-columns">
                      <label className="admin-field">
                        <span>
                          Conversion ID
                        </span>
                        <input
                          placeholder="AW-123456789"
                          value={
                            globalSettings
                              .integrations
                              .googleAds
                              .conversionId
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                integrations: {
                                  ...current
                                    .integrations,
                                  googleAds: {
                                    ...current
                                      .integrations
                                      .googleAds,
                                    conversionId:
                                      event
                                        .target
                                        .value,
                                  },
                                },
                              }),
                            )
                          }
                        />
                      </label>
                      <label className="admin-field">
                        <span>
                          Conversion Label
                        </span>
                        <input
                          placeholder="AbCdEfGh..."
                          value={
                            globalSettings
                              .integrations
                              .googleAds
                              .conversionLabel
                          }
                          onChange={(
                            event,
                          ) =>
                            setGlobalSettings(
                              (
                                current,
                              ) => ({
                                ...current,
                                integrations: {
                                  ...current
                                    .integrations,
                                  googleAds: {
                                    ...current
                                      .integrations
                                      .googleAds,
                                    conversionLabel:
                                      event
                                        .target
                                        .value,
                                  },
                                },
                              }),
                            )
                          }
                        />
                      </label>
                    </div>
                    <p className="integration-card__note integration-card__note--warning">
                      Bu alan Google Ads ayarını Firestore&apos;da saklar. Conversion event gönderimini IntegrationManager tarafında ayrıca bağlamalısın.
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
                          Facebook ve Instagram reklam ölçümü
                        </small>
                      </div>
                      <StatusBadge
                        active={
                          globalSettings
                            .integrations
                            .metaPixel
                            .enabled
                        }
                      />
                      <button
                        type="button"
                        className={
                          `control-toggle ${
                            globalSettings
                              .integrations
                              .metaPixel
                              .enabled
                              ? "is-active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                metaPixel: {
                                  ...current
                                    .integrations
                                    .metaPixel,
                                  enabled:
                                    !current
                                      .integrations
                                      .metaPixel
                                      .enabled,
                                },
                              },
                            }),
                          )
                        }
                      >
                        <span />
                      </button>
                    </div>
                    <label className="admin-field">
                      <span>
                        Meta Pixel ID
                      </span>
                      <input
                        inputMode="numeric"
                        placeholder="123456789012345"
                        value={
                          globalSettings
                            .integrations
                            .metaPixel
                            .pixelId
                        }
                        onChange={(
                          event,
                        ) =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              integrations: {
                                ...current
                                  .integrations,
                                metaPixel: {
                                  ...current
                                    .integrations
                                    .metaPixel,
                                  pixelId:
                                    event
                                      .target
                                      .value,
                                },
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <p className="integration-card__note">
                      Pazarlama çerez izni verildiğinde Meta Pixel runtime üzerinden yüklenir.
                    </p>
                  </article>
                </div>
              </section>
            )}
            {activeTab ===
              "maintenance" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="ACCESS CONTROL"
                  title="Bakım Modu"
                  description="Ziyaretçi erişimini kapatın, kurumsal bakım ekranını yönetin ve admin bypass davranışını ayarlayın."
                >
                  <StatusBadge
                    active={
                      globalSettings
                        .maintenance
                        .enabled
                    }
                    activeText="Bakım açık"
                    passiveText="Site açık"
                  />
                </PanelHeading>
                <div
                  className={
                    `maintenance-switch-card ${
                      globalSettings
                        .maintenance
                        .enabled
                        ? "is-active"
                        : ""
                    }`
                  }
                >
                  <div>
                    <span>
                      PUBLIC SITE STATUS
                    </span>
                    <strong>
                      {globalSettings
                        .maintenance
                        .enabled
                        ? "Bakım modu aktif"
                        : "Site normal yayında"}
                    </strong>
                    <p>
                      {globalSettings
                        .maintenance
                        .enabled
                        ? "Normal ziyaretçiler bakım ekranını görecek."
                        : "Public site tüm ziyaretçilere açık."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={
                      `control-toggle ${
                        globalSettings
                          .maintenance
                          .enabled
                          ? "is-active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      setGlobalSettings(
                        (
                          current,
                        ) => ({
                          ...current,
                          maintenance: {
                            ...current
                              .maintenance,
                            enabled:
                              !current
                                .maintenance
                                .enabled,
                          },
                        }),
                      )
                    }
                  >
                    <span />
                  </button>
                </div>
                <Switch
                  checked={
                    globalSettings
                      .maintenance
                      .allowAdminBypass
                  }
                  label="Admin bypass"
                  description="Aktif admin kullanıcıları bakım modunda public siteyi görüntüleyebilir."
                  onChange={(
                    checked,
                  ) =>
                    setGlobalSettings(
                      (
                        current,
                      ) => ({
                        ...current,
                        maintenance: {
                          ...current
                            .maintenance,
                          allowAdminBypass:
                            checked,
                        },
                      }),
                    )
                  }
                />
                <div className="control-fields">
                  <label className="admin-field">
                    <span>
                      Üst Küçük Metin
                    </span>
                    <input
                      value={
                        globalSettings
                          .maintenance
                          .eyebrow
                      }
                      onChange={(
                        event,
                      ) =>
                        setGlobalSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            maintenance: {
                              ...current
                                .maintenance,
                              eyebrow:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Bakım Başlığı
                    </span>
                    <textarea
                      rows={3}
                      value={
                        globalSettings
                          .maintenance
                          .title
                      }
                      onChange={(
                        event,
                      ) =>
                        setGlobalSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            maintenance: {
                              ...current
                                .maintenance,
                              title:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>
                      Açıklama
                    </span>
                    <textarea
                      rows={6}
                      value={
                        globalSettings
                          .maintenance
                          .description
                      }
                      onChange={(
                        event,
                      ) =>
                        setGlobalSettings(
                          (
                            current,
                          ) => ({
                            ...current,
                            maintenance: {
                              ...current
                                .maintenance,
                              description:
                                event
                                  .target
                                  .value,
                            },
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="admin-two-columns">
                    <label className="admin-field">
                      <span>
                        Durum Metni
                      </span>
                      <input
                        value={
                          globalSettings
                            .maintenance
                            .statusText
                        }
                        onChange={(
                          event,
                        ) =>
                          setGlobalSettings(
                            (
                              current,
                            ) => ({
                              ...current,
                              maintenance: {
                                ...current
                                  .maintenance,
                                statusText:
                                  event
                                    .target
                                    .value,
                              },
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>
                        Tahmini Bitiş
                      </span>
                      <input
                        placeholder="Örn. 15 Temmuz 10:00"
                        value={
                          globalSettings
                            .maintenance
                            .estimatedEndText
                        }
                        onChange={(event) =>
                          setGlobalSettings(
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

                  <div className="control-divider">
                    BAKIM EKRANI İLETİŞİM
                  </div>

                  <Switch
                    checked={
                      globalSettings
                        .maintenance
                        .showContactButton
                    }
                    label="İletişim butonunu göster"
                    description="Bakım ekranında ziyaretçiye iletişim bağlantısı gösterir."
                    onChange={(checked) =>
                      setGlobalSettings(
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

                  <div className="admin-two-columns">
                    <label className="admin-field">
                      <span>
                        Buton Yazısı
                      </span>

                      <input
                        value={
                          globalSettings
                            .maintenance
                            .contactButtonLabel
                        }
                        onChange={(event) =>
                          setGlobalSettings(
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
                      <span>
                        Buton Linki
                      </span>

                      <input
                        placeholder="/iletisim veya https://wa.me/..."
                        value={
                          globalSettings
                            .maintenance
                            .contactButtonHref
                        }
                        onChange={(event) =>
                          setGlobalSettings(
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

                  <div className="maintenance-preview">
                    <span className="maintenance-preview__eyebrow">
                      CANLI BAKIM EKRANI
                    </span>

                    <div className="maintenance-preview__window">
                      <div className="maintenance-preview__browser">
                        <span />
                        <span />
                        <span />

                        <small>
                          {settings.branding.siteName}
                        </small>
                      </div>

                      <div className="maintenance-preview__content">
                        <span className="maintenance-preview__mark">
                          {globalSettings
                            .branding
                            .monogram || "UB"}
                        </span>

                        <small>
                          {
                            globalSettings
                              .maintenance
                              .eyebrow
                          }
                        </small>

                        <h3>
                          {
                            globalSettings
                              .maintenance
                              .title
                          }
                        </h3>

                        <p>
                          {
                            globalSettings
                              .maintenance
                              .description
                          }
                        </p>

                        <div className="maintenance-preview__status">
                          <span />

                          {
                            globalSettings
                              .maintenance
                              .statusText
                          }
                        </div>

                        {globalSettings
                          .maintenance
                          .estimatedEndText && (
                          <strong>
                            {
                              globalSettings
                                .maintenance
                                .estimatedEndText
                            }
                          </strong>
                        )}

                        {globalSettings
                          .maintenance
                          .showContactButton &&
                          globalSettings
                            .maintenance
                            .contactButtonLabel && (
                          <span className="maintenance-preview__button">
                            {
                              globalSettings
                                .maintenance
                                .contactButtonLabel
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "technical" && (
              <section className="control-panel">
                <PanelHeading
                  eyebrow="TECHNICAL CONTROL"
                  title="Teknik Site Ayarları"
                  description="Canlı site adresi, yerel ayarlar ve genel frontend davranışlarını yönetin."
                />

                <div className="control-fields">
                  <label className="admin-field">
                    <span>
                      Canlı Site URL
                    </span>

                    <input
                      type="url"
                      placeholder="https://ugurbeyspot.com"
                      value={
                        globalSettings
                          .technical
                          .siteUrl
                      }
                      onChange={(event) =>
                        setGlobalSettings(
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
                      <span>
                        Varsayılan Dil
                      </span>

                      <input
                        placeholder="tr-TR"
                        value={
                          globalSettings
                            .technical
                            .defaultLocale
                        }
                        onChange={(event) =>
                          setGlobalSettings(
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
                      <span>
                        Saat Dilimi
                      </span>

                      <input
                        placeholder="Europe/Istanbul"
                        value={
                          globalSettings
                            .technical
                            .timezone
                        }
                        onChange={(event) =>
                          setGlobalSettings(
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
                    <span>
                      Para Birimi
                    </span>

                    <input
                      maxLength={3}
                      placeholder="TRY"
                      value={
                        globalSettings
                          .technical
                          .currency
                      }
                      onChange={(event) =>
                        setGlobalSettings(
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

                  <div className="control-divider">
                    FRONTEND DAVRANIŞLARI
                  </div>

                  <Switch
                    checked={
                      globalSettings
                        .technical
                        .enableAnimations
                    }
                    label="Gelişmiş animasyonlar"
                    description="Hero, reveal ve premium hareket efektlerini aktif tutar."
                    onChange={(checked) =>
                      setGlobalSettings(
                        (current) => ({
                          ...current,

                          technical: {
                            ...current.technical,

                            enableAnimations:
                              checked,
                          },
                        }),
                      )
                    }
                  />

                  <Switch
                    checked={
                      globalSettings
                        .technical
                        .enablePageTransitions
                    }
                    label="Sayfa geçiş deneyimi"
                    description="Sayfalar arası geçiş davranışını aktif tutar."
                    onChange={(checked) =>
                      setGlobalSettings(
                        (current) => ({
                          ...current,

                          technical: {
                            ...current.technical,

                            enablePageTransitions:
                              checked,
                          },
                        }),
                      )
                    }
                  />

                  <Switch
                    checked={
                      globalSettings
                        .technical
                        .enableImageLazyLoading
                    }
                    label="Görsel lazy loading"
                    description="Desteklenen görselleri ihtiyaç anında yükler."
                    onChange={(checked) =>
                      setGlobalSettings(
                        (current) => ({
                          ...current,

                          technical: {
                            ...current.technical,

                            enableImageLazyLoading:
                              checked,
                          },
                        }),
                      )
                    }
                  />

                  <Switch
                    checked={
                      globalSettings
                        .technical
                        .showAnnouncementBar
                    }
                    label="Global duyuru alanı"
                    description="Site ayarlarındaki aktif duyurunun gösterilmesine izin verir."
                    onChange={(checked) =>
                      setGlobalSettings(
                        (current) => ({
                          ...current,

                          technical: {
                            ...current.technical,

                            showAnnouncementBar:
                              checked,
                          },
                        }),
                      )
                    }
                  />

                  <div className="technical-status-grid">
                    <article className="technical-status-card">
                      <span>
                        SITE URL
                      </span>

                      <strong>
                        {globalSettings
                          .technical
                          .siteUrl
                          ? "Tanımlı"
                          : "Eksik"}
                      </strong>

                      <StatusBadge
                        active={
                          Boolean(
                            globalSettings
                              .technical
                              .siteUrl,
                          )
                        }
                      />
                    </article>

                    <article className="technical-status-card">
                      <span>
                        LOCALE
                      </span>

                      <strong>
                        {globalSettings
                          .technical
                          .defaultLocale ||
                          "-"}
                      </strong>

                      <StatusBadge
                        active={
                          Boolean(
                            globalSettings
                              .technical
                              .defaultLocale,
                          )
                        }
                      />
                    </article>

                    <article className="technical-status-card">
                      <span>
                        TIMEZONE
                      </span>

                      <strong>
                        {globalSettings
                          .technical
                          .timezone ||
                          "-"}
                      </strong>

                      <StatusBadge
                        active={
                          Boolean(
                            globalSettings
                              .technical
                              .timezone,
                          )
                        }
                      />
                    </article>

                    <article className="technical-status-card">
                      <span>
                        CURRENCY
                      </span>

                      <strong>
                        {globalSettings
                          .technical
                          .currency ||
                          "-"}
                      </strong>

                      <StatusBadge
                        active={
                          Boolean(
                            globalSettings
                              .technical
                              .currency,
                          )
                        }
                      />
                    </article>
                  </div>
                  <div className="control-divider">
                    SEO VARSAYILANLARI
                  </div>

                  <label className="admin-field">
                    <span>
                      Varsayılan SEO Başlığı
                    </span>

                    <input
                      value={
                        settings
                          .seo
                          .defaultSeo
                          .title
                      }
                      onChange={(event) =>
                        setSettings(
                          (current) => ({
                            ...current,

                            seo: {
                              ...current.seo,

                              defaultSeo: {
                                ...current
                                  .seo
                                  .defaultSeo,

                                title:
                                  event
                                    .target
                                    .value,
                              },
                            },
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      Varsayılan SEO Açıklaması
                    </span>

                    <textarea
                      rows={5}
                      value={
                        settings
                          .seo
                          .defaultSeo
                          .description
                      }
                      onChange={(event) =>
                        setSettings(
                          (current) => ({
                            ...current,

                            seo: {
                              ...current.seo,

                              defaultSeo: {
                                ...current
                                  .seo
                                  .defaultSeo,

                                description:
                                  event
                                    .target
                                    .value,
                              },
                            },
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      SEO Anahtar Kelimeleri
                    </span>

                    <textarea
                      rows={4}
                      placeholder="spot ürünler, ikinci el, mağaza..."
                      value={
                        settings
                          .seo
                          .defaultSeo
                          .keywords
                          .join(", ")
                      }
                      onChange={(event) =>
                        setSettings(
                          (current) => ({
                            ...current,

                            seo: {
                              ...current.seo,

                              defaultSeo: {
                                ...current
                                  .seo
                                  .defaultSeo,

                                keywords:
                                  event
                                    .target
                                    .value
                                    .split(",")
                                    .map(
                                      (item) =>
                                        item.trim(),
                                    )
                                    .filter(Boolean),
                              },
                            },
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      Canonical URL
                    </span>

                    <input
                      type="url"
                      placeholder="https://ugurbeyspot.com"
                      value={
                        settings
                          .seo
                          .defaultSeo
                          .canonicalUrl ||
                        ""
                      }
                      onChange={(event) =>
                        setSettings(
                          (current) => ({
                            ...current,

                            seo: {
                              ...current.seo,

                              defaultSeo: {
                                ...current
                                  .seo
                                  .defaultSeo,

                                canonicalUrl:
                                  event
                                    .target
                                    .value,
                              },
                            },
                          }),
                        )
                      }
                    />
                  </label>

                  <label className="admin-field">
                    <span>
                      Varsayılan OG Görsel URL
                    </span>

                    <input
                      type="url"
                      placeholder="https://..."
                      value={
                        settings
                          .seo
                          .defaultSeo
                          .ogImageUrl ||
                        ""
                      }
                      onChange={(event) =>
                        setSettings(
                          (current) => ({
                            ...current,

                            seo: {
                              ...current.seo,

                              defaultSeo: {
                                ...current
                                  .seo
                                  .defaultSeo,

                                ogImageUrl:
                                  event
                                    .target
                                    .value,
                              },
                            },
                          }),
                        )
                      }
                    />
                  </label>

                  <Switch
                    checked={
                      settings
                        .seo
                        .defaultSeo
                        .noIndex === true
                    }
                    label="Siteyi arama motorlarından gizle"
                    description="Aktif edildiğinde varsayılan SEO ayarında noIndex kullanılır."
                    onChange={(checked) =>
                      setSettings(
                        (current) => ({
                          ...current,

                          seo: {
                            ...current.seo,

                            defaultSeo: {
                              ...current
                                .seo
                                .defaultSeo,

                              noIndex:
                                checked,
                            },
                          },
                        }),
                      )
                    }
                  />
                </div>
              </section>
            )}
          </main>
        </div>

        <div className="control-save-bar">
          <div>
            <span>
              SITE CONTROL CENTER
            </span>

            <strong>
              Tüm site ve global ayarları kaydet
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
