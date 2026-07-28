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

import { COLLECTIONS, STORAGE_PATHS } from "@/lib/constants";
import { auth, db } from "@/lib/firebase";
import { deleteImageAsset, uploadCustomerImages } from "@/lib/storage";
import type { ImageAsset, SellRequest, SellRequestStatus } from "@/lib/types";
import { stripUndefined } from "@/lib/utils";

export interface SellRequestInput {
  fullName: string;
  phone: string;
  district?: string;
  category: string;
  brandModel?: string;
  condition: string;
  description: string;
  expectedPrice?: number;
  files: File[];
}

function mapRequest(id: string, raw: unknown): SellRequest {
  const data = raw as Record<string, unknown>;
  const status = data.status;
  return {
    id,
    customerUid: typeof data.customerUid === "string" ? data.customerUid : undefined,
    customerEmail: typeof data.customerEmail === "string" ? data.customerEmail : undefined,
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    phone: typeof data.phone === "string" ? data.phone : "",
    district: typeof data.district === "string" ? data.district : undefined,
    category: typeof data.category === "string" ? data.category : "",
    brandModel: typeof data.brandModel === "string" ? data.brandModel : undefined,
    condition: typeof data.condition === "string" ? data.condition : "",
    description: typeof data.description === "string" ? data.description : "",
    expectedPrice: typeof data.expectedPrice === "number" ? data.expectedPrice : undefined,
    images: Array.isArray(data.images) ? data.images as ImageAsset[] : [],
    status: status === "reviewing" || status === "offered" || status === "completed" || status === "rejected" ? status : "new",
    adminNote: typeof data.adminNote === "string" ? data.adminNote : undefined,
    offeredPrice: typeof data.offeredPrice === "number" ? data.offeredPrice : undefined,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
}

export async function submitSellRequest(
  input: SellRequestInput,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (input.fullName.trim().length < 2 || input.phone.trim().length < 7) throw new Error("İletişim bilgilerini kontrol edin.");
  if (!input.category || !input.condition || input.description.trim().length < 10) throw new Error("Eşya bilgilerini biraz daha detaylı yazın.");
  if (input.files.length < 1 || input.files.length > 6) throw new Error("1 ile 6 arasında fotoğraf ekleyin.");

  const requestKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const images = await uploadCustomerImages(
    input.files,
    `${STORAGE_PATHS.sellRequests}/${requestKey}`,
    `${input.category} satış talebi`,
    onProgress,
  );
  const now = new Date().toISOString();
  const result = await addDoc(collection(db, COLLECTIONS.sellRequests), stripUndefined({
    customerUid: auth.currentUser?.uid,
    customerEmail: auth.currentUser?.email || undefined,
    fullName: input.fullName.trim(), phone: input.phone.trim(),
    district: input.district?.trim() || undefined, category: input.category,
    brandModel: input.brandModel?.trim() || undefined, condition: input.condition,
    description: input.description.trim(), expectedPrice: input.expectedPrice,
    images, status: "new", createdAt: now, updatedAt: now,
  }));
  return result.id;
}

export async function getCustomerSellRequests(): Promise<SellRequest[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.sellRequests),
      where("customerUid", "==", user.uid),
    ),
  );

  return snapshot.docs
    .map((item) => mapRequest(item.id, item.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSellRequests(): Promise<SellRequest[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.sellRequests));
  return snapshot.docs.map((item) => mapRequest(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSellRequest(id: string, status: SellRequestStatus, adminNote: string, offeredPrice?: number): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.sellRequests, id), stripUndefined({
    status, adminNote: adminNote.trim(), offeredPrice, updatedAt: new Date().toISOString(),
  }));
}

export async function deleteSellRequest(request: SellRequest): Promise<void> {
  await Promise.all(request.images.map((image) => deleteImageAsset(image)));
  await deleteDoc(doc(db, COLLECTIONS.sellRequests, request.id));
}
