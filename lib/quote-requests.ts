import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { getAttribution } from "@/lib/attribution";
import {
  COLLECTIONS,
  CONTACT_LIMITS,
  QUICK_QUOTE_LIMITS,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import type {
  QuoteRequest,
  QuoteRequestProductItem,
  QuoteRequestStatus,
} from "@/lib/types";
import { isValidEmail } from "@/lib/utils";

export interface QuickQuoteRequestInput {
  fullName: string;
  phone: string;
  email?: string;

  selectedProducts: QuoteRequestProductItem[];

  answers: {
    need: string;
    budgetRange: string;
    urgency: string;
    additionalNotes?: string;

    purchaseType?: "single" | "bundle" | "unsure";
    condition?: "new" | "used" | "mixed";
    delivery?: "store" | "delivery" | "installation";
  };

  estimate?: {
    min: number;
    max: number;
    currency: "TRY";
    calculatedAt: string;
  };

  sourcePage?: string;
}

export interface QuoteRequestAdminUpdateInput {
  status: QuoteRequestStatus;
  adminNote?: string;
  offeredPrice?: number | null;
}

/**
 * Firestore nested object içinde undefined kabul etmez.
 * Bu yardımcı fonksiyon tüm nested undefined değerleri temizler.
 */
function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => removeUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date)
  ) {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (nestedValue === undefined) {
        continue;
      }

      result[key] = removeUndefinedDeep(nestedValue);
    }

    return result as T;
  }

  return value;
}

function toIsoDate(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value
  ) {
    const candidate = value as {
      toDate?: () => Date;
    };

    if (typeof candidate.toDate === "function") {
      const date = candidate.toDate();

      if (
        date instanceof Date &&
        !Number.isNaN(date.getTime())
      ) {
        return date.toISOString();
      }
    }
  }

  return new Date().toISOString();
}

function toNumber(value: unknown): number | undefined {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return undefined;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function mapQuoteRequest(
  id: string,
  data: unknown,
): QuoteRequest {
  const source = isRecord(data) ? data : {};

  const selectedProductsRaw = Array.isArray(
    source.selectedProducts,
  )
    ? source.selectedProducts
    : [];

  const selectedProducts = selectedProductsRaw
    .filter(isRecord)
    .filter(
      (item) =>
        typeof item.productId === "string" &&
        typeof item.title === "string" &&
        typeof item.slug === "string" &&
        typeof item.price === "number" &&
        Number.isFinite(item.price),
    )
    .map((item) => ({
      productId: item.productId as string,
      title: item.title as string,
      slug: item.slug as string,
      price: item.price as number,
    }));

  const answersSource = isRecord(source.answers)
    ? source.answers
    : {};

  const estimateSource = isRecord(source.estimate)
    ? source.estimate
    : undefined;

  return {
    id,

    fullName:
      typeof source.fullName === "string"
        ? source.fullName
        : "Müşteri",

    phone:
      typeof source.phone === "string"
        ? source.phone
        : "",

    email:
      typeof source.email === "string"
        ? source.email
        : undefined,

    status:
      source.status === "new" ||
      source.status === "reviewing" ||
      source.status === "offered" ||
      source.status === "closed"
        ? source.status
        : "new",

    selectedProducts,

    answers: {
      need:
        typeof answersSource.need === "string"
          ? answersSource.need
          : "",

      budgetRange:
        typeof answersSource.budgetRange === "string"
          ? answersSource.budgetRange
          : "",

      urgency:
        typeof answersSource.urgency === "string"
          ? answersSource.urgency
          : "",

      additionalNotes:
        typeof answersSource.additionalNotes ===
        "string"
          ? answersSource.additionalNotes
          : undefined,

      purchaseType:
        answersSource.purchaseType === "single" ||
        answersSource.purchaseType === "bundle" ||
        answersSource.purchaseType === "unsure"
          ? answersSource.purchaseType
          : undefined,

      condition:
        answersSource.condition === "new" ||
        answersSource.condition === "used" ||
        answersSource.condition === "mixed"
          ? answersSource.condition
          : undefined,

      delivery:
        answersSource.delivery === "store" ||
        answersSource.delivery === "delivery" ||
        answersSource.delivery === "installation"
          ? answersSource.delivery
          : undefined,
    },

    estimate: estimateSource
      ? {
          min: toNumber(estimateSource.min) ?? 0,
          max: toNumber(estimateSource.max) ?? 0,
          currency: "TRY",
          calculatedAt: toIsoDate(
            estimateSource.calculatedAt,
          ),
        }
      : undefined,

    sourcePage:
      typeof source.sourcePage === "string"
        ? source.sourcePage
        : undefined,

    adminNote:
      typeof source.adminNote === "string"
        ? source.adminNote
        : undefined,

    offeredPrice: toNumber(source.offeredPrice),

    offeredAt: source.offeredAt
      ? toIsoDate(source.offeredAt)
      : undefined,

    createdAt: toIsoDate(source.createdAt),
    updatedAt: toIsoDate(source.updatedAt),
  };
}

function validateQuickQuoteInput(
  input: QuickQuoteRequestInput,
): void {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || "";
  const need = input.answers.need.trim();
  const budgetRange =
    input.answers.budgetRange.trim();
  const urgency = input.answers.urgency.trim();
  const additionalNotes =
    input.answers.additionalNotes?.trim() || "";

  if (
    fullName.length < 2 ||
    fullName.length >
      CONTACT_LIMITS.fullNameMaxLength
  ) {
    throw new Error(
      "Ad soyad bilgisini kontrol edin.",
    );
  }

  if (
    phone.length < 7 ||
    phone.length > CONTACT_LIMITS.phoneMaxLength
  ) {
    throw new Error(
      "Telefon bilgisini kontrol edin.",
    );
  }

  if (
    email &&
    (!isValidEmail(email) ||
      email.length >
        CONTACT_LIMITS.emailMaxLength)
  ) {
    throw new Error(
      "Geçerli bir e-posta adresi girin.",
    );
  }

  if (!budgetRange || !urgency) {
    throw new Error(
      "Bütçe ve süre tercihlerini seçin.",
    );
  }

  if (
    !need &&
    input.selectedProducts.length === 0 &&
    !additionalNotes
  ) {
    throw new Error(
      "En az bir ürün seçin veya ihtiyacınızı yazın.",
    );
  }

  if (
    input.selectedProducts.length >
    QUICK_QUOTE_LIMITS.selectedProductsMaxCount
  ) {
    throw new Error(
      "Çok fazla ürün seçildi.",
    );
  }

  if (
    additionalNotes.length >
    QUICK_QUOTE_LIMITS.additionalNotesMaxLength
  ) {
    throw new Error(
      "Ek not alanı çok uzun.",
    );
  }

  for (const item of input.selectedProducts) {
    if (
      !item.productId?.trim() ||
      !item.title?.trim() ||
      !item.slug?.trim() ||
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price < 0
    ) {
      throw new Error(
        "Seçilen ürün bilgilerinden biri geçersiz.",
      );
    }
  }

  if (input.estimate) {
    if (
      !Number.isFinite(input.estimate.min) ||
      !Number.isFinite(input.estimate.max) ||
      input.estimate.min < 0 ||
      input.estimate.max < 0 ||
      input.estimate.max < input.estimate.min
    ) {
      throw new Error(
        "Tahmini fiyat bilgisi geçersiz.",
      );
    }
  }
}

export async function submitQuickQuoteRequest(
  input: QuickQuoteRequestInput,
): Promise<string> {
  validateQuickQuoteInput(input);

  const now = new Date().toISOString();

  /**
   * İlk ve son reklam temasını alır.
   *
   * Örnek:
   * tracking.firstTouch.gclid
   * tracking.lastTouch.utmCampaign
   */
  const tracking = getAttribution();

  const payload = removeUndefinedDeep({
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,

    status: "new" as const,

    selectedProducts: input.selectedProducts.map(
      (item) => ({
        productId: item.productId.trim(),
        title: item.title.trim(),
        slug: item.slug.trim(),
        price: Number(item.price.toFixed(2)),
      }),
    ),

    answers: {
      need: input.answers.need.trim(),
      budgetRange:
        input.answers.budgetRange.trim(),
      urgency: input.answers.urgency.trim(),

      additionalNotes:
        input.answers.additionalNotes?.trim() ||
        undefined,

      purchaseType:
        input.answers.purchaseType,

      condition:
        input.answers.condition,

      delivery:
        input.answers.delivery,
    },

    estimate: input.estimate
      ? {
          min: Number(
            input.estimate.min.toFixed(2),
          ),
          max: Number(
            input.estimate.max.toFixed(2),
          ),
          currency: "TRY" as const,
          calculatedAt:
            input.estimate.calculatedAt,
        }
      : undefined,

    sourcePage:
      input.sourcePage?.trim() || undefined,

    tracking,

    createdAt: now,
    updatedAt: now,
  });

  const created = await addDoc(
    collection(
      db,
      COLLECTIONS.quoteRequests,
    ),
    payload,
  );

  return created.id;
}

export async function getQuickQuoteRequests(): Promise<
  QuoteRequest[]
> {
  const snapshot = await getDocs(
    collection(
      db,
      COLLECTIONS.quoteRequests,
    ),
  );

  return snapshot.docs
    .map((item) =>
      mapQuoteRequest(
        item.id,
        item.data(),
      ),
    )
    .sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
}

export async function updateQuickQuoteRequestByAdmin(
  id: string,
  input: QuoteRequestAdminUpdateInput,
): Promise<void> {
  const requestId = id.trim();
  const adminNote =
    input.adminNote?.trim() || "";

  if (!requestId) {
    throw new Error(
      "Teklif talebi kimliği bulunamadı.",
    );
  }

  if (
    input.status !== "new" &&
    input.status !== "reviewing" &&
    input.status !== "offered" &&
    input.status !== "closed"
  ) {
    throw new Error(
      "Teklif durumu geçersiz.",
    );
  }

  if (
    adminNote.length >
    QUICK_QUOTE_LIMITS.adminNoteMaxLength
  ) {
    throw new Error(
      "Admin notu çok uzun.",
    );
  }

  let offeredPrice: number | undefined;

  if (
    typeof input.offeredPrice === "number"
  ) {
    if (
      !Number.isFinite(input.offeredPrice) ||
      input.offeredPrice < 0
    ) {
      throw new Error(
        "Teklif fiyatını kontrol edin.",
      );
    }

    const normalizedPrice = Number(
      input.offeredPrice.toFixed(2),
    );

    const digitCount = normalizedPrice
      .toString()
      .replace(".", "")
      .replace("-", "").length;

    if (
      digitCount >
      QUICK_QUOTE_LIMITS.offeredPriceMaxDigits
    ) {
      throw new Error(
        "Teklif fiyatı çok büyük.",
      );
    }

    offeredPrice = normalizedPrice;
  }

  const now = new Date().toISOString();

  const payload = removeUndefinedDeep({
    status: input.status,

    adminNote:
      adminNote || undefined,

    offeredPrice,

    offeredAt:
      input.status === "offered"
        ? now
        : undefined,

    updatedAt: now,
  });

  await updateDoc(
    doc(
      db,
      COLLECTIONS.quoteRequests,
      requestId,
    ),
    payload,
  );
}

export async function deleteQuickQuoteRequest(
  id: string,
): Promise<void> {
  const requestId = id.trim();

  if (!requestId) {
    throw new Error(
      "Teklif talebi kimliği bulunamadı.",
    );
  }

  await deleteDoc(
    doc(
      db,
      COLLECTIONS.quoteRequests,
      requestId,
    ),
  );
}