import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  COLLECTIONS,
  PRODUCT_REVIEW_LIMITS,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import type {
  ProductReview,
  ProductReviewStatus,
} from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

export interface ProductReviewInput {
  productId: string;
  productSlug: string;
  productTitle: string;
  fullName: string;
  rating: number;
  comment: string;
  sourcePage?: string;
}

function mapReview(id: string, data: unknown): ProductReview {
  return {
    id,
    ...(data as Omit<ProductReview, "id">),
  };
}

function validateReviewInput(input: ProductReviewInput): void {
  if (!input.fullName.trim()) {
    throw new Error("Ad soyad zorunludur.");
  }

  if (input.fullName.trim().length > PRODUCT_REVIEW_LIMITS.fullNameMaxLength) {
    throw new Error("Ad soyad alanı çok uzun.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Puan 1 ile 5 arasında olmalıdır.");
  }

  if (!input.comment.trim()) {
    throw new Error("Yorum alanı zorunludur.");
  }

  if (input.comment.trim().length > PRODUCT_REVIEW_LIMITS.commentMaxLength) {
    throw new Error("Yorum çok uzun.");
  }
}

export async function submitProductReview(input: ProductReviewInput): Promise<string> {
  validateReviewInput(input);

  const now = new Date().toISOString();

  const payload = stripUndefined({
    productId: input.productId,
    productSlug: input.productSlug,
    productTitle: input.productTitle,
    fullName: input.fullName.trim(),
    rating: input.rating,
    comment: input.comment.trim(),
    status: "pending" as const,
    sourcePage: input.sourcePage,
    createdAt: now,
    updatedAt: now,
  });

  const created = await addDoc(collection(db, COLLECTIONS.productReviews), payload);

  return created.id;
}

export async function getApprovedProductReviews(productId: string): Promise<ProductReview[]> {
  const reviewsQuery = query(
    collection(db, COLLECTIONS.productReviews),
    where("productId", "==", productId),
    where("status", "==", "approved"),
  );

  const snapshot = await getDocs(reviewsQuery);

  return snapshot.docs
    .map((item) => mapReview(item.id, item.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, PRODUCT_REVIEW_LIMITS.listPerProduct);
}

export async function getProductReviews(
  status: ProductReviewStatus | "all" = "all",
): Promise<ProductReview[]> {
  const baseCollection = collection(db, COLLECTIONS.productReviews);
  const snapshot =
    status === "all"
      ? await getDocs(baseCollection)
      : await getDocs(
          query(baseCollection, where("status", "==", status)),
        );

  return snapshot.docs
    .map((item) => mapReview(item.id, item.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateProductReviewStatus(
  id: string,
  status: ProductReviewStatus,
  adminNote?: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.productReviews, id), {
    status,
    adminNote: adminNote?.trim() || "",
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProductReview(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.productReviews, id));
}
