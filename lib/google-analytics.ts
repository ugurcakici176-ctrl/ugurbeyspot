export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim().toUpperCase() ||
  "G-BKZV5YM11D";

export const GOOGLE_TAG_MANAGER_ID =
  process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim().toUpperCase() ||
  "GTM-PXXL7MWC";

/** Google Ads etiketi (AW-…). GTM container'ında Ads etiketi olmadığı için sitede yüklenir. */
const rawAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim().toUpperCase() || "";

export const GOOGLE_ADS_ID = /^AW-\d+$/.test(rawAdsId) ? rawAdsId : "";
