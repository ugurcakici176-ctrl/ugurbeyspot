/**
 * Stores first-touch and last-touch advertising attribution values.
 * No personal data is stored here.
 */

export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  landingPage?: string;
  referrer?: string;
  capturedAt?: string;
}

const FIRST_TOUCH_KEY = "ugurbeyspot:first_touch";
const LAST_TOUCH_KEY = "ugurbeyspot:last_touch";

function clean(value: string | null): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 500);
}

function readStorage(key: string): AttributionData | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw) as AttributionData;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: AttributionData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked by the browser.
  }
}

export function captureAttribution(): AttributionData | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const params = new URLSearchParams(window.location.search);

  const attribution: AttributionData = {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmTerm: clean(params.get("utm_term")),
    utmContent: clean(params.get("utm_content")),
    gclid: clean(params.get("gclid")),
    gbraid: clean(params.get("gbraid")),
    wbraid: clean(params.get("wbraid")),
    landingPage: clean(
      `${window.location.pathname}${window.location.search}`,
    ),
    referrer: clean(document.referrer),
    capturedAt: new Date().toISOString(),
  };

  const hasCampaignData = Boolean(
    attribution.utmSource ||
      attribution.utmMedium ||
      attribution.utmCampaign ||
      attribution.gclid ||
      attribution.gbraid ||
      attribution.wbraid,
  );

  if (!hasCampaignData) {
    return readStorage(LAST_TOUCH_KEY) || readStorage(FIRST_TOUCH_KEY);
  }

  if (!readStorage(FIRST_TOUCH_KEY)) {
    writeStorage(FIRST_TOUCH_KEY, attribution);
  }

  writeStorage(LAST_TOUCH_KEY, attribution);

  return attribution;
}

export function getAttribution(): {
  firstTouch?: AttributionData;
  lastTouch?: AttributionData;
} {
  return {
    firstTouch: readStorage(FIRST_TOUCH_KEY),
    lastTouch: readStorage(LAST_TOUCH_KEY),
  };
}
