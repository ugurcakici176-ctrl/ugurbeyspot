import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { BRAND_ASSETS } from "@/lib/branding";

export type GtmConsentCategory =
  | "analytics"
  | "marketing";

export interface GlobalSiteSettings {
  branding: {
    logoMode: "monogram" | "image";
    logoUrl: string;
    logoStoragePath: string;
    logoAlt: string;
    monogram: string;
    siteName: string;
    slogan: string;
    accentColor: string;
  };

  integrations: {
    ga4: {
      enabled: boolean;
      measurementId: string;
    };
    gtm: {
      enabled: boolean;
      containerId: string;
      consentCategory: GtmConsentCategory;
    };
    metaPixel: {
      enabled: boolean;
      pixelId: string;
    };
  };

  maintenance: {
    enabled: boolean;
    allowAdminBypass: boolean;
    eyebrow: string;
    title: string;
    description: string;
    statusText: string;
    estimatedEndText: string;
    showContactButton: boolean;
    contactButtonLabel: string;
    contactButtonHref: string;
  };

  business: {
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    mapsUrl: string;
    workingHours: string;
  };

  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
  };

  technical: {
    siteUrl: string;
    defaultLocale: string;
    timezone: string;
    currency: string;
    enableAnimations: boolean;
    enablePageTransitions: boolean;
    enableImageLazyLoading: boolean;
    showAnnouncementBar: boolean;
  };

  updatedAt: string;
}

export const GLOBAL_SITE_SETTINGS_EVENT =
  "ugurbey:global-site-settings-change";

export const DEFAULT_GLOBAL_SITE_SETTINGS: GlobalSiteSettings = {
  branding: {
    logoMode: "image",
    logoUrl: BRAND_ASSETS.mark,
    logoStoragePath: "",
    logoAlt: "Uğur Bey Spot",
    monogram: "UB",
    siteName: "Uğur Bey Spot",
    slogan: "Spot Ürünler · Güncel Seçkiler",
    accentColor: "#e2b100",
  },

  integrations: {
    ga4: {
      enabled: false,
      measurementId: "",
    },
    gtm: {
      enabled: false,
      containerId: "",
      consentCategory: "analytics",
    },
    metaPixel: {
      enabled: false,
      pixelId: "",
    },
  },

  maintenance: {
    enabled: false,
    allowAdminBypass: true,
    eyebrow: "KISA BİR ARA",
    title:
      "Mağazamızı daha iyi bir deneyim için yeniliyoruz.",
    description:
      "Uğur Bey Spot dijital mağazasında planlı bir çalışma yürütüyoruz. Çok yakında daha hızlı ve daha güçlü bir deneyimle yeniden buradayız.",
    statusText: "Planlı bakım çalışması",
    estimatedEndText: "",
    showContactButton: true,
    contactButtonLabel: "Bizimle İletişime Geçin",
    contactButtonHref: "/iletisim",
  },

  business: {
    phone: "",
    email: "",
    whatsapp: "",
    address: "",
    mapsUrl: "",
    workingHours: "",
  },

  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
  },

  technical: {
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://ugurbeyspot---ugurbeyspot-51329.europe-west4.hosted.app",
    defaultLocale: "tr-TR",
    timezone: "Europe/Istanbul",
    currency: "TRY",
    enableAnimations: true,
    enablePageTransitions: true,
    enableImageLazyLoading: true,
    showAnnouncementBar: true,
  },

  updatedAt: "",
};

let cachedSettings: GlobalSiteSettings | null = null;
let pendingRequest: Promise<GlobalSiteSettings> | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeSettings(
  data: Partial<GlobalSiteSettings>,
): GlobalSiteSettings {
  const fallback = clone(
    DEFAULT_GLOBAL_SITE_SETTINGS,
  );

  const merged: GlobalSiteSettings = {
    ...fallback,
    ...data,

    branding: {
      ...fallback.branding,
      ...data.branding,
    },

    integrations: {
      ...fallback.integrations,
      ...data.integrations,

      ga4: {
        ...fallback.integrations.ga4,
        ...data.integrations?.ga4,
      },

      gtm: {
        ...fallback.integrations.gtm,
        ...data.integrations?.gtm,
      },

      metaPixel: {
        ...fallback.integrations.metaPixel,
        ...data.integrations?.metaPixel,
      },
    },

    maintenance: {
      ...fallback.maintenance,
      ...data.maintenance,
    },

    business: {
      ...fallback.business,
      ...data.business,
    },

    social: {
      ...fallback.social,
      ...data.social,
    },

    technical: {
      ...fallback.technical,
      ...data.technical,
    },
  };

  if (
    merged.branding.accentColor
      .trim()
      .toLowerCase() ===
    "#f06a24"
  ) {
    merged.branding.accentColor =
      fallback.branding.accentColor;
  }

  return merged;
}

async function fetchGlobalSiteSettings():
  Promise<GlobalSiteSettings> {
  const fallback = clone(
    DEFAULT_GLOBAL_SITE_SETTINGS,
  );

  try {
    const snapshot = await getDoc(
      doc(
        db,
        "site_settings",
        "global_control_center",
      ),
    );

    if (!snapshot.exists()) {
      return fallback;
    }

    return mergeSettings(
      snapshot.data() as Partial<GlobalSiteSettings>,
    );
  } catch (error) {
    console.error(
      "Global site settings could not be loaded:",
      error,
    );

    return fallback;
  }
}

export async function getGlobalSiteSettings(
  forceRefresh = false,
): Promise<GlobalSiteSettings> {
  if (
    cachedSettings &&
    !forceRefresh
  ) {
    return clone(cachedSettings);
  }

  if (
    pendingRequest &&
    !forceRefresh
  ) {
    return clone(
      await pendingRequest,
    );
  }

  pendingRequest =
    fetchGlobalSiteSettings();

  try {
    cachedSettings =
      await pendingRequest;

    return clone(
      cachedSettings,
    );
  } finally {
    pendingRequest = null;
  }
}

export function clearGlobalSiteSettingsCache(): void {
  cachedSettings = null;
}

export async function saveGlobalSiteSettings(
  settings: GlobalSiteSettings,
): Promise<void> {
  const savedSettings: GlobalSiteSettings = {
    ...settings,
    updatedAt:
      new Date().toISOString(),
  };

  await setDoc(
    doc(
      db,
      "site_settings",
      "global_control_center",
    ),
    savedSettings,
    {
      merge: true,
    },
  );

  cachedSettings =
    clone(savedSettings);

  if (
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        GLOBAL_SITE_SETTINGS_EVENT,
        {
          detail:
            clone(savedSettings),
        },
      ),
    );
  }
}
