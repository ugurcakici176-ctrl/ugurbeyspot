import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import type {
  Category,
  CategoryFormValues,
  EntityStatus,
} from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

function mapCategory(id: string, data: unknown): Category {
  return {
    id,
    ...(data as Omit<Category, "id">),
  };
}

export async function getCategories(options?: {
  includePassive?: boolean;
  status?: EntityStatus;
}): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.categories));

  let categories = snapshot.docs.map((item) =>
    mapCategory(item.id, item.data()),
  );

  if (!options?.includePassive) {
    categories = categories.filter((item) => item.status === "active");
  }

  if (options?.status) {
    categories = categories.filter(
      (item) => item.status === options.status,
    );
  }

  return categories.sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name, "tr-TR"),
  );
}

export async function getCategoryById(
  id: string,
): Promise<Category | null> {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.categories, id),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapCategory(snapshot.id, snapshot.data());
}

export async function getCategoryBySlug(
  slug: string,
  includePassive = false,
): Promise<Category | null> {
  const categoryQuery = query(
    collection(db, COLLECTIONS.categories),
    where("slug", "==", slug),
    limit(1),
  );

  const snapshot = await getDocs(categoryQuery);
  const first = snapshot.docs[0];

  if (!first) {
    return null;
  }

  const category = mapCategory(first.id, first.data());

  if (!includePassive && category.status !== "active") {
    return null;
  }

  return category;
}

export async function isCategorySlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const categoryQuery = query(
    collection(db, COLLECTIONS.categories),
    where("slug", "==", slug),
  );

  const snapshot = await getDocs(categoryQuery);

  return snapshot.docs.every((item) => item.id === excludeId);
}

export async function createCategory(
  values: CategoryFormValues,
): Promise<Category> {
  const now = new Date().toISOString();

  const payload = stripUndefined({
    ...values,
    createdAt: now,
    updatedAt: now,
  }) as Omit<Category, "id">;

  const created = await addDoc(
    collection(db, COLLECTIONS.categories),
    payload,
  );

  return {
    id: created.id,
    ...payload,
  };
}

export async function updateCategory(
  id: string,
  values: Partial<CategoryFormValues>,
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.categories, id),
    stripUndefined({
      ...values,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}
