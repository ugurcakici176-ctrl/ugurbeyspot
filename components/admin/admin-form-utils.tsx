"use client";

import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  useState,
} from "react";

import { useAdminSession } from "@/hooks/use-admin-session";
import { normalizeTurkeyPhone } from "@/lib/utils";

/* ─────────────────────────────────────────────
 * Fiyat ayrıştırma / biçimlendirme
 * ───────────────────────────────────────────── */

/**
 * Admin fiyat alanındaki metni sayıya çevirir.
 * Hem Türkçe biçimi ("1.250,50", "1.250") hem de nokta ondalıklı biçimi
 * ("1250.5", "1250.50") kabul eder.
 *
 * - Hem "." hem "," varsa en sondaki ayırıcı ondalık ayırıcıdır.
 * - Yalnızca "," varsa ondalık ayırıcıdır (birden fazla ve 3'lü gruplar
 *   halindeyse binlik ayırıcı kabul edilir).
 * - Yalnızca "." varsa; birden fazla nokta veya noktadan sonra tam 3 hane
 *   varsa binlik ayırıcı, aksi halde ondalık ayırıcı kabul edilir.
 *
 * Boş metin için `null`, geçersiz metin için `NaN` döner.
 */
export function parseAdminPrice(
  value: string,
): number | null {
  const compact = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/₺|TL|TRY/gi, "");

  if (!compact) {
    return null;
  }

  if (!/^-?[\d.,]+$/.test(compact)) {
    return Number.NaN;
  }

  const lastDot = compact.lastIndexOf(".");
  const lastComma = compact.lastIndexOf(",");
  let normalized: string;

  if (lastDot > -1 && lastComma > -1) {
    normalized =
      lastComma > lastDot
        ? compact.replace(/\./g, "").replace(",", ".")
        : compact.replace(/,/g, "");
  } else if (lastComma > -1) {
    const groups = compact.split(",");

    normalized =
      groups.length > 2 &&
      groups.slice(1).every((group) => group.length === 3)
        ? groups.join("")
        : groups.length === 2
          ? groups.join(".")
          : "invalid";
  } else if (lastDot > -1) {
    const groups = compact.split(".");
    const thousands =
      groups.slice(1).every((group) => group.length === 3);

    normalized =
      thousands
        ? groups.join("")
        : groups.length === 2
          ? groups.join(".")
          : "invalid";
  } else {
    normalized = compact;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : Number.NaN;
}

/** Kayıtlı fiyatı Türkçe biçimde input değerine çevirir (örn. 1250.5 → "1.250,5"). */
export function formatAdminPriceInput(
  value: number | null | undefined,
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
}

/* ─────────────────────────────────────────────
 * Anahtar kelime alanı
 * ───────────────────────────────────────────── */

export function parseKeywords(
  value: string,
): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sameKeywords(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

type KeywordsFieldProps = {
  value: readonly string[];
  onKeywordsChange: (keywords: string[]) => void;
} & (
  | ({ multiline?: false } & Omit<
      InputHTMLAttributes<HTMLInputElement>,
      "value" | "onChange" | "onBlur"
    >)
  | ({ multiline: true } & Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "value" | "onChange" | "onBlur"
    >)
);

/**
 * Virgülle ayrılmış anahtar kelime alanı. Kullanıcının yazdığı ham metin
 * yerel durumda tutulur; böylece yazarken virgül ve boşluklar kaybolmaz.
 * Üst bileşene her değişiklikte ayrıştırılmış liste iletilir, odak
 * kaybolduğunda metin düzenlenmiş biçimde gösterilir.
 */
export function KeywordsField(
  props: KeywordsFieldProps,
) {
  const {
    value,
    onKeywordsChange,
    multiline,
    ...rest
  } = props;

  const [rawText, setRawText] = useState(() =>
    value.join(", "),
  );
  const [syncedValue, setSyncedValue] =
    useState(value);

  // Değer dışarıdan değiştiyse (yükleme, otomatik SEO vb.) ham metni güncelle.
  if (syncedValue !== value) {
    setSyncedValue(value);

    if (!sameKeywords(parseKeywords(rawText), value)) {
      setRawText(value.join(", "));
    }
  }

  function handleChange(text: string): void {
    setRawText(text);
    onKeywordsChange(parseKeywords(text));
  }

  function handleBlur(): void {
    setRawText(parseKeywords(rawText).join(", "));
  }

  if (multiline) {
    return (
      <textarea
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        value={rawText}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <input
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
      value={rawText}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  );
}

/* ─────────────────────────────────────────────
 * WhatsApp bağlantısı
 * ───────────────────────────────────────────── */

/** Türkiye numaralarını 90XXXXXXXXXX biçimine çevirip wa.me bağlantısı üretir. */
export function buildAdminWhatsappHref(
  phone: string,
): string {
  const normalized = normalizeTurkeyPhone(phone);

  if (
    normalized.length < 10 ||
    normalized.length > 15
  ) {
    return "";
  }

  return `https://wa.me/${normalized}`;
}

/* ─────────────────────────────────────────────
 * Yetki
 * ───────────────────────────────────────────── */

/**
 * Firestore kuralları silme işlemine yalnızca super_admin ve admin
 * rollerinde izin verir (isManagerAdmin). Editörlerde silme butonları
 * gizlenir.
 */
export function useCanDeleteRecords(): boolean {
  const { session } = useAdminSession();
  const role = session?.admin.role;

  return role === "super_admin" || role === "admin";
}
