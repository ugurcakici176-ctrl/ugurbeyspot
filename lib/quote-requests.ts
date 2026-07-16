import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

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
import {
  isValidEmail,
  stripUndefined,
} from "@/lib/utils";

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

function toIsoDate(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();

    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return undefined;
}

function mapQuoteRequest(id: string, data: unknown): QuoteRequest {
  const source = data as Record<string, unknown>;
  const selectedProductsRaw = Array.isArray(source.selectedProducts)
    ? source.selectedProducts
    : [];

  const selectedProducts = selectedProductsRaw
    .map((item) => item as Record<string, unknown>)
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

  const answersSource =
    typeof source.answers === "object" && source.answers !== null
      ? (source.answers as Record<string, unknown>)
      : {};

  return {
    id,
    fullName: typeof source.fullName === "string" ? source.fullName : "Musteri",
    phone: typeof source.phone === "string" ? source.phone : "",
    email: typeof source.email === "string" ? source.email : undefined,
    status:
      source.status === "new" ||
      source.status === "reviewing" ||
      source.status === "offered" ||
      source.status === "closed"
        ? source.status
        : "new",
    selectedProducts,
    answers: {
      need: typeof answersSource.need === "string" ? answersSource.need : "",
      budgetRange:
        typeof answersSource.budgetRange === "string"
          ? answersSource.budgetRange
          : "",
      urgency: typeof answersSource.urgency === "string" ? answersSource.urgency : "",
      additionalNotes:
        typeof answersSource.additionalNotes === "string"
          ? answersSource.additionalNotes
          : undefined,
      purchaseType: answersSource.purchaseType === "single" || answersSource.purchaseType === "bundle" || answersSource.purchaseType === "unsure" ? answersSource.purchaseType : undefined,
      condition: answersSource.condition === "new" || answersSource.condition === "used" || answersSource.condition === "mixed" ? answersSource.condition : undefined,
      delivery: answersSource.delivery === "store" || answersSource.delivery === "delivery" || answersSource.delivery === "installation" ? answersSource.delivery : undefined,
    },
    estimate: typeof source.estimate === "object" && source.estimate !== null ? {
      min: toNumber((source.estimate as Record<string, unknown>).min) || 0,
      max: toNumber((source.estimate as Record<string, unknown>).max) || 0,
      currency: "TRY",
      calculatedAt: toIsoDate((source.estimate as Record<string, unknown>).calculatedAt),
    } : undefined,
    sourcePage: typeof source.sourcePage === "string" ? source.sourcePage : undefined,
    adminNote: typeof source.adminNote === "string" ? source.adminNote : undefined,
    offeredPrice: toNumber(source.offeredPrice),
    offeredAt: source.offeredAt ? toIsoDate(source.offeredAt) : undefined,
    createdAt: toIsoDate(source.createdAt),
    updatedAt: toIsoDate(source.updatedAt),
  };
}

function validateQuickQuoteInput(input: QuickQuoteRequestInput): void {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const need = input.answers.need.trim();
  const additionalNotes = (input.answers.additionalNotes || "").trim();

  if (fullName.length < 2 || fullName.length > CONTACT_LIMITS.fullNameMaxLength) {
    throw new Error("Ad soyad bilgisini kontrol edin.");
  }

  if (phone.length < 7 || phone.length > CONTACT_LIMITS.phoneMaxLength) {
    throw new Error("Telefon bilgisini kontrol edin.");
  }

  if (
    input.email?.trim() &&
    (!isValidEmail(input.email) || input.email.trim().length > CONTACT_LIMITS.emailMaxLength)
  ) {
    throw new Error("Gecerli bir e-posta adresi girin.");
  }

  if (
    !input.answers.budgetRange.trim() ||
    !input.answers.urgency.trim()
  ) {
    throw new Error("Butce ve sure tercihlerini secin.");
  }

  if (!need && input.selectedProducts.length === 0 && !additionalNotes) {
    throw new Error("En az bir urun secin veya ihtiyacinizi yazin.");
  }

  if (input.selectedProducts.length > QUICK_QUOTE_LIMITS.selectedProductsMaxCount) {
    throw new Error("Cok fazla urun secildi.");
  }

  if (additionalNotes.length > QUICK_QUOTE_LIMITS.additionalNotesMaxLength) {
    throw new Error("Ek not alani cok uzun.");
  }
}

export async function submitQuickQuoteRequest(
  input: QuickQuoteRequestInput,
): Promise<string> {
  validateQuickQuoteInput(input);

  const now = new Date().toISOString();

  const payload = stripUndefined({
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    status: "new" as const,
    selectedProducts: input.selectedProducts.map((item) => ({
      productId: item.productId,
      title: item.title,
      slug: item.slug,
      price: item.price,
    })),
    answers: {
      need: input.answers.need.trim(),
      budgetRange: input.answers.budgetRange.trim(),
      urgency: input.answers.urgency.trim(),
      additionalNotes: input.answers.additionalNotes?.trim() || undefined,
      purchaseType: input.answers.purchaseType,
      condition: input.answers.condition,
      delivery: input.answers.delivery,
    },
    estimate: input.estimate,
    sourcePage: input.sourcePage,
    createdAt: now,
    updatedAt: now,
  });

  const created = await addDoc(
    collection(db, COLLECTIONS.quoteRequests),
    payload,
  );

  return created.id;
}

export async function getQuickQuoteRequests(): Promise<QuoteRequest[]> {
  const snapshot = await getDocs(
    collection(db, COLLECTIONS.quoteRequests),
  );

  return snapshot.docs
    .map((item) => mapQuoteRequest(item.id, item.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateQuickQuoteRequestByAdmin(
  id: string,
  input: QuoteRequestAdminUpdateInput,
): Promise<void> {
  const adminNote = (input.adminNote || "").trim();

  if (
    adminNote.length > QUICK_QUOTE_LIMITS.adminNoteMaxLength
  ) {
    throw new Error("Admin notu cok uzun.");
  }

  let offeredPrice: number | undefined;

  if (typeof input.offeredPrice === "number") {
    if (!Number.isFinite(input.offeredPrice) || input.offeredPrice < 0) {
      throw new Error("Teklif fiyatini kontrol edin.");
    }

    const normalizedPrice = Number(input.offeredPrice.toFixed(2));

    if (
      normalizedPrice.toString().replace(".", "").length >
      QUICK_QUOTE_LIMITS.offeredPriceMaxDigits
    ) {
      throw new Error("Teklif fiyati cok buyuk.");
    }

    offeredPrice = normalizedPrice;
  }

  await updateDoc(
    doc(db, COLLECTIONS.quoteRequests, id),
    stripUndefined({
      status: input.status,
      adminNote: adminNote || undefined,
      offeredPrice,
      offeredAt: input.status === "offered" ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export async function deleteQuickQuoteRequest(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.quoteRequests, id));
}
