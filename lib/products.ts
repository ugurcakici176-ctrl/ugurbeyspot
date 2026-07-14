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

import {
  COLLECTIONS,
  QUERY_LIMITS,
  SORT_OPTIONS,
} from "@/lib/constants";
import { db } from "@/lib/firebase";
import type {
  Product,
  ProductFormValues,
  StockStatus,
} from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

export type ProductSort =
  (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

export interface ProductQueryOptions {
  includePassive?: boolean;
  categoryId?: string;
  featuredOnly?: boolean;
  newOnly?: boolean;
  stockStatus?: StockStatus;
  search?: string;
  sort?: ProductSort;
  limitCount?: number;
}

function mapProduct(id: string, data: unknown): Product {
  return {
    id,
    ...(data as Omit<Product, "id">),
  };
}

function sortProducts(
  products: Product[],
  sort: ProductSort = SORT_OPTIONS.newest,
): Product[] {
  return [...products].sort((a, b) => {
    if (sort === SORT_OPTIONS.priceAscending) {
      return a.price - b.price;
    }

    if (sort === SORT_OPTIONS.priceDescending) {
      return b.price - a.price;
    }

    if (sort === SORT_OPTIONS.featured) {
      const featuredDifference =
        Number(b.featured) - Number(a.featured);

      if (featuredDifference !== 0) {
        return featuredDifference;
      }
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getProducts(
  options: ProductQueryOptions = {},
): Promise<Product[]> {
  const snapshot = await getDocs(
    collection(db, COLLECTIONS.products),
  );

  let products = snapshot.docs.map((item) =>
    mapProduct(item.id, item.data()),
  );

  if (!options.includePassive) {
    products = products.filter((item) => item.status === "active");
  }

  if (options.categoryId) {
    products = products.filter(
      (item) => item.categoryId === options.categoryId,
    );
  }

  if (options.featuredOnly) {
    products = products.filter((item) => item.featured);
  }

  if (options.newOnly) {
    products = products.filter((item) => item.isNew);
  }

  if (options.stockStatus) {
    products = products.filter(
      (item) => item.stockStatus === options.stockStatus,
    );
  }

  if (options.search?.trim()) {
    const search = options.search
      .trim()
      .toLocaleLowerCase("tr-TR");

    products = products.filter((item) =>
      [
        item.title,
        item.shortDescription,
        item.categoryName ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(search),
    );
  }

  const sorted = sortProducts(products, options.sort);

  return options.limitCount
    ? sorted.slice(0, options.limitCount)
    : sorted;
}

export async function getProductById(
  id: string,
): Promise<Product | null> {
  const snapshot = await getDoc(
    doc(db, COLLECTIONS.products, id),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapProduct(snapshot.id, snapshot.data());
}

export async function getProductBySlug(
  slug: string,
  includePassive = false,
): Promise<Product | null> {
  const productQuery = query(
    collection(db, COLLECTIONS.products),
    where("slug", "==", slug),
    limit(1),
  );

  const snapshot = await getDocs(productQuery);
  const first = snapshot.docs[0];

  if (!first) {
    return null;
  }

  const product = mapProduct(first.id, first.data());

  if (!includePassive && product.status !== "active") {
    return null;
  }

  return product;
}

export async function isProductSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const productQuery = query(
    collection(db, COLLECTIONS.products),
    where("slug", "==", slug),
  );

  const snapshot = await getDocs(productQuery);

  return snapshot.docs.every((item) => item.id === excludeId);
}

export async function createProduct(
  values: ProductFormValues,
): Promise<Product> {
  const now = new Date().toISOString();

  const payload = stripUndefined({
    ...values,
    createdAt: now,
    updatedAt: now,
  }) as Omit<Product, "id">;

  const created = await addDoc(
    collection(db, COLLECTIONS.products),
    payload,
  );

  return {
    id: created.id,
    ...payload,
  };
}

export async function updateProduct(
  id: string,
  values: Partial<ProductFormValues>,
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.products, id),
    stripUndefined({
      ...values,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.products, id));
}

export async function getFeaturedProducts(
  limitCount = QUERY_LIMITS.homepageFeaturedProducts,
): Promise<Product[]> {
  return getProducts({
    featuredOnly: true,
    sort: SORT_OPTIONS.featured,
    limitCount,
  });
}

export async function getRelatedProducts(
  product: Product,
  limitCount = QUERY_LIMITS.relatedProducts,
): Promise<Product[]> {
  const products = await getProducts({
    categoryId: product.categoryId,
    sort: SORT_OPTIONS.newest,
  });

  return products
    .filter((item) => item.id !== product.id)
    .slice(0, limitCount);
}
