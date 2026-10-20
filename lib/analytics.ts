/**
 * Uğur Bey Spot - Google Ads + GA4 event helper
 *
 * Environment variables:
 * NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_QUICK_QUOTE_LABEL=XXXXXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL=XXXXXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_SELL_REQUEST_LABEL=XXXXXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_PHONE_LABEL=XXXXXXXXXXXX      (telefon tıklaması)
 * NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL=XXXXXXXXXXXX   (WhatsApp tıklaması)
 *
 * Etiket boşsa yalnızca GA4 olayı gönderilir (GA4 key event olarak Ads'e
 * aktarılabilir). Ads etiketi layout'ta GOOGLE_ADS_ID ile yüklenir.
 *
 * Conversion events must only be fired AFTER Firestore confirms success.
 */

import { readCookieConsent } from "@/lib/cookie-consent";
import { normalizeTurkeyPhone } from "@/lib/utils";

export type LeadFormName =
  | "quick_quote"
  | "contact"
  | "sell_request";

export interface LeadConversionInput {
  formName: LeadFormName;
  transactionId: string;
  value?: number;
  currency?: "TRY";
  sourcePage?: string;
  /** Gelişmiş dönüşümler: gtag değerleri tarayıcıda hash'leyerek gönderir. */
  userData?: {
    email?: string;
    phone?: string;
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();

const CLICK_LABELS = {
  phone: process.env.NEXT_PUBLIC_GOOGLE_ADS_PHONE_LABEL?.trim(),
  // Etiketler gizli değildir; env yoksa Ads'te oluşturulan işlemler kullanılır.
  whatsapp:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL?.trim() ||
    "CodpCOjYtKMdEPuxwqxE",
};

const LABELS: Record<LeadFormName, string | undefined> = {
  quick_quote:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_QUICK_QUOTE_LABEL?.trim(),
  contact:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL?.trim(),
  sell_request:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_SELL_REQUEST_LABEL?.trim(),
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function setEnhancedConversionData(
  gtag: (...args: unknown[]) => void,
  userData: LeadConversionInput["userData"],
): void {
  // Kişisel veri yalnızca pazarlama çerezine izin verildiyse paylaşılır.
  if (!userData || readCookieConsent()?.marketing !== true) {
    return;
  }

  const email = userData.email?.trim().toLowerCase();
  const phoneDigits = userData.phone ? normalizeTurkeyPhone(userData.phone) : "";
  const data: Record<string, string> = {};

  if (email && email.includes("@")) {
    data.email = email;
  }

  if (/^90\d{10}$/.test(phoneDigits)) {
    data.phone_number = `+${phoneDigits}`;
  }

  if (Object.keys(data).length > 0) {
    gtag("set", "user_data", data);
  }
}

function getGtag(): ((...args: unknown[]) => void) | null {
  if (!isBrowser() || typeof window.gtag !== "function") {
    return null;
  }

  return window.gtag;
}

export function trackGa4Event(
  eventName: string,
  parameters: Record<string, unknown> = {},
): void {
  const gtag = getGtag();

  if (!gtag) {
    return;
  }

  gtag("event", eventName, parameters);
}

export function trackLeadConversion({
  formName,
  transactionId,
  value = 1,
  currency = "TRY",
  sourcePage,
  userData,
}: LeadConversionInput): void {
  const gtag = getGtag();

  if (!gtag || !transactionId) {
    return;
  }

  setEnhancedConversionData(gtag, userData);

  // GA4 lead event
  gtag("event", "generate_lead", {
    form_name: formName,
    source_page:
      sourcePage ||
      (isBrowser()
        ? `${window.location.pathname}${window.location.search}`
        : undefined),
    transaction_id: transactionId,
    value,
    currency,
  });

  // Form-specific GA4 event
  gtag("event", `${formName}_submit`, {
    form_name: formName,
    transaction_id: transactionId,
    value,
    currency,
  });

  // Google Ads conversion
  const label = LABELS[formName];

  if (!ADS_ID || !label) {
    return;
  }

  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    transaction_id: transactionId,
    value,
    currency,
  });
}

function trackClickConversion(kind: keyof typeof CLICK_LABELS): void {
  const gtag = getGtag();
  const label = CLICK_LABELS[kind];

  if (!gtag || !ADS_ID || !label) {
    return;
  }

  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    value: 1,
    currency: "TRY",
  });
}

export function trackPhoneClick(phone?: string): void {
  trackGa4Event("phone_click", {
    phone: phone || undefined,
    page_location: isBrowser() ? window.location.href : undefined,
  });
  trackClickConversion("phone");
}

export function trackWhatsAppClick(target?: string): void {
  trackGa4Event("whatsapp_click", {
    target: target || undefined,
    page_location: isBrowser() ? window.location.href : undefined,
  });
  trackClickConversion("whatsapp");
}
