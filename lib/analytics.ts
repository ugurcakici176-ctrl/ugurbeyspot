/**
 * Uğur Bey Spot - Google Ads + GA4 event helper
 *
 * Environment variables:
 * NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_QUICK_QUOTE_LABEL=XXXXXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL=XXXXXXXXXXXX
 * NEXT_PUBLIC_GOOGLE_ADS_SELL_REQUEST_LABEL=XXXXXXXXXXXX
 *
 * Conversion events must only be fired AFTER Firestore confirms success.
 */

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
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();

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
}: LeadConversionInput): void {
  const gtag = getGtag();

  if (!gtag || !transactionId) {
    return;
  }

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
console.log("ADS_ID =", ADS_ID);
console.log("LABEL =", label);
console.log("SEND_TO =", `${ADS_ID}/${label}`);
 if (!ADS_ID || !label) {
  console.warn("Google Ads conversion yapılandırması eksik:", {
    formName,
    adsIdExists: Boolean(ADS_ID),
    labelExists: Boolean(label),
  });

  return;
}

  gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    transaction_id: transactionId,
    value,
    currency,
  });
}

export function trackPhoneClick(phone?: string): void {
  trackGa4Event("phone_click", {
    phone: phone || undefined,
    page_location: isBrowser() ? window.location.href : undefined,
  });
}

export function trackWhatsAppClick(target?: string): void {
  trackGa4Event("whatsapp_click", {
    target: target || undefined,
    page_location: isBrowser() ? window.location.href : undefined,
  });
}
