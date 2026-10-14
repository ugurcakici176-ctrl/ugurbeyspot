import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
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

const PRODUCT_BATCH_SIZE = 450;

/**
 * Ürünlerde saklanan (denormalize) kategori adını günceller.
 * Firestore batch limiti nedeniyle en fazla 450'lik parçalar halinde yazılır.
 */
async function syncProductCategoryName(
  categoryId: string,
  categoryName: string,
): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.products),
      where("categoryId", "==", categoryId),
    ),
  );

  const docsToUpdate = snapshot.docs.filter(
    (item) => item.data().categoryName !== categoryName,
  );

  const now = new Date().toISOString();

  for (
    let index = 0;
    index < docsToUpdate.length;
    index += PRODUCT_BATCH_SIZE
  ) {
    const batch = writeBatch(db);

    for (const item of docsToUpdate.slice(
      index,
      index + PRODUCT_BATCH_SIZE,
    )) {
      batch.update(item.ref, {
        categoryName,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  return docsToUpdate.length;
}

export async function updateCategory(
  id: string,
  values: Partial<CategoryFormValues>,
): Promise<void> {
  const categoryRef = doc(db, COLLECTIONS.categories, id);

  const previous =
    typeof values.name === "string"
      ? await getDoc(categoryRef)
      : null;

  const payload: Record<string, unknown> = stripUndefined({
    ...values,
    updatedAt: new Date().toISOString(),
  });

  // Görsel temizlendiyse alanı Firestore'dan kaldır (stripUndefined
  // undefined değerleri düşürdüğü için aksi halde eski görsel kalıyordu).
  if ("image" in values && !values.image) {
    payload.image = deleteField();
  }

  await updateDoc(categoryRef, payload);

  const nextName = values.name?.trim();

  if (
    nextName &&
    previous?.exists() &&
    previous.data().name !== nextName
  ) {
    await syncProductCategoryName(id, nextName);
  }
}

export async function countCategoryProducts(
  categoryId: string,
): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.products),
      where("categoryId", "==", categoryId),
    ),
  );

  return snapshot.size;
}

export async function deleteCategory(id: string): Promise<void> {
  const productCount = await countCategoryProducts(id);

  if (productCount > 0) {
    throw new Error(
      `Bu kategoriye bağlı ${productCount} ürün var. Kategoriyi silmeden önce ürünleri başka bir kategoriye taşıyın veya silin.`,
    );
  }

  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}
