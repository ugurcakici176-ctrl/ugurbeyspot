import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import type { CampaignBanner } from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

function mapBanner(id: string, data: unknown): CampaignBanner {
  return { id, ...(data as Omit<CampaignBanner, "id">) };
}

export async function getBanners(
  includePassive = false,
): Promise<CampaignBanner[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.banners));

  return snapshot.docs
    .map((item) => mapBanner(item.id, item.data()))
    .filter((item) => includePassive || item.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createBanner(
  values: Omit<CampaignBanner, "id" | "createdAt" | "updatedAt">,
): Promise<CampaignBanner> {
  const now = new Date().toISOString();
  const payload = stripUndefined({
    ...values,
    createdAt: now,
    updatedAt: now,
  }) as Omit<CampaignBanner, "id">;

  const created = await addDoc(
    collection(db, COLLECTIONS.banners),
    payload,
  );

  return { id: created.id, ...payload };
}

export async function updateBanner(
  id: string,
  values: Partial<Omit<CampaignBanner, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.banners, id),
    stripUndefined({
      ...values,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.banners, id));
}
