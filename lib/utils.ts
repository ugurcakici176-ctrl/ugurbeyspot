import { DEFAULT_WHATSAPP_MESSAGE, SITE } from "@/lib/constants";

type UnknownRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  if (isPlainObject(value)) {
    const result: UnknownRecord = {};

    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = stripUndefined(item);
      }
    }

    return result as T;
  }

  return value;
}

function mergeUnknown(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(override)) {
    return [...override];
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: UnknownRecord = { ...base };

    for (const [key, value] of Object.entries(override)) {
      result[key] = mergeUnknown(base[key], value);
    }

    return result;
  }

  return override;
}

export function deepMerge<T>(base: T, override: Partial<T>): T {
  return mergeUnknown(base, override) as T;
}

export function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function createId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function safeFileName(value: string): string {
  const dotIndex = value.lastIndexOf(".");
  const extension =
    dotIndex > -1 ? value.slice(dotIndex + 1).toLowerCase() : "";
  const baseName = dotIndex > -1 ? value.slice(0, dotIndex) : value;
  const safeBase = slugify(baseName) || "gorsel";

  return extension ? `${safeBase}.${extension}` : safeBase;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(SITE.currencyLocale, {
    style: "currency",
    currency: SITE.currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  },
): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", options).format(date);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeTurkeyPhone(phone: string): string {
  const digits = normalizePhone(phone);

  if (digits.length === 10 && digits.startsWith("5")) {
    return `90${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `90${digits.slice(1)}`;
  }

  return digits;
}

function normalizeWhatsappTarget(value: string): string {
  const input = value.trim();

  if (!input) {
    return "";
  }

  // Accept direct wa.me links and api.whatsapp.com URLs from admin input.
  if (/^https?:\/\//i.test(input) || input.includes("wa.me")) {
    try {
      const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
      const hostname = parsed.hostname.toLowerCase();

      if (hostname.includes("wa.me")) {
        const pathPhone = normalizeTurkeyPhone(parsed.pathname.replaceAll("/", ""));

        if (pathPhone.length >= 10 && pathPhone.length <= 15) {
          return pathPhone;
        }
      }

      if (hostname.includes("whatsapp.com")) {
        const queryPhone = normalizeTurkeyPhone(parsed.searchParams.get("phone") || "");

        if (queryPhone.length >= 10 && queryPhone.length <= 15) {
          return queryPhone;
        }
      }
    } catch {
      return "";
    }

    return "";
  }

  const normalized = normalizeTurkeyPhone(input);

  if (normalized.length < 10 || normalized.length > 15) {
    return "";
  }

  return normalized;
}

export function buildWhatsappUrl(
  phone: string,
  message = DEFAULT_WHATSAPP_MESSAGE,
): string {
  const normalizedPhone = normalizeWhatsappTarget(phone);

  if (!normalizedPhone) {
    return "";
  }

  const query = new URLSearchParams({ text: message });

  return `https://wa.me/${normalizedPhone}?${query.toString()}`;
}

export function buildTelUrl(phone: string): string {
  return `tel:+${normalizeTurkeyPhone(phone)}`;
}

export function getDiscountPercent(
  price: number,
  compareAtPrice?: number | null,
): number {
  if (
    !compareAtPrice ||
    compareAtPrice <= price ||
    compareAtPrice <= 0 ||
    price < 0
  ) {
    return 0;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

export function joinUrl(baseUrl: string, path: string): string {
  return new URL(
    path,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  ).toString();
}
