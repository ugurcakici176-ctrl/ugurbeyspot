export const COOKIE_CONSENT_KEY =
  "ugurbey_cookie_consent_v1";

export const COOKIE_CONSENT_EVENT =
  "ugurbey:consent-change";

export const COOKIE_SETTINGS_EVENT =
  "ugurbey:open-cookie-settings";

export interface CookieConsentPreferences {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
}

export function createCookieConsent(
  analytics: boolean,
  marketing: boolean,
): CookieConsentPreferences {
  return {
    version: 1,
    necessary: true,
    analytics,
    marketing,
    savedAt: new Date().toISOString(),
  };
}

export function readCookieConsent():
  | CookieConsentPreferences
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        COOKIE_CONSENT_KEY,
      );

    if (!raw) {
      return null;
    }

    const value =
      JSON.parse(raw) as Partial<CookieConsentPreferences>;

    if (
      value.version !== 1 ||
      value.necessary !== true ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean" ||
      typeof value.savedAt !== "string"
    ) {
      return null;
    }

    return value as CookieConsentPreferences;
  } catch {
    return null;
  }
}

export function saveCookieConsent(
  preferences: CookieConsentPreferences,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify(preferences),
  );

  window.dispatchEvent(
    new CustomEvent(
      COOKIE_CONSENT_EVENT,
      {
        detail: preferences,
      },
    ),
  );
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      COOKIE_SETTINGS_EVENT,
    ),
  );
}
