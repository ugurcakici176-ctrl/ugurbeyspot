import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  updateProfile,
} from "firebase/auth";

import { COLLECTIONS } from "@/lib/constants";
import {
  auth,
  db,
} from "@/lib/firebase";
import type {
  CustomerProfile,
} from "@/lib/types";

export interface CustomerProfileInput {
  fullName: string;
  phone: string;
  district?: string;
}

function normalizeProfile(
  uid: string,
  raw: unknown,
): CustomerProfile | null {
  if (
    typeof raw !== "object" ||
    raw === null
  ) {
    return null;
  }

  const data =
    raw as Record<string, unknown>;

  return {
    uid,
    fullName:
      typeof data.fullName === "string"
        ? data.fullName
        : "",
    email:
      typeof data.email === "string"
        ? data.email
        : "",
    phone:
      typeof data.phone === "string"
        ? data.phone
        : "",
    district:
      typeof data.district === "string"
        ? data.district
        : undefined,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

export async function getCustomerProfile(
  uid?: string,
): Promise<CustomerProfile | null> {
  const currentUid =
    uid || auth.currentUser?.uid;

  if (!currentUid) {
    return null;
  }

  const snapshot = await getDoc(
    doc(
      db,
      COLLECTIONS.customers,
      currentUid,
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeProfile(
    snapshot.id,
    snapshot.data(),
  );
}

export async function saveCustomerProfile(
  input: CustomerProfileInput,
): Promise<CustomerProfile> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Profilinizi güncellemek için giriş yapmalısınız.",
    );
  }

  const fullName =
    input.fullName.trim();

  const phone =
    input.phone
      .replace(/\s+/g, " ")
      .trim();

  const district =
    input.district?.trim() || "";

  if (fullName.length < 2) {
    throw new Error(
      "Ad soyad en az 2 karakter olmalıdır.",
    );
  }

  if (fullName.length > 100) {
    throw new Error(
      "Ad soyad en fazla 100 karakter olabilir.",
    );
  }

  if (phone.length < 7) {
    throw new Error(
      "Geçerli bir telefon numarası girin.",
    );
  }

  if (phone.length > 30) {
    throw new Error(
      "Telefon numarası çok uzun.",
    );
  }

  if (district.length > 120) {
    throw new Error(
      "İlçe veya mahalle bilgisi çok uzun.",
    );
  }

  const now =
    new Date().toISOString();

  const existing =
    await getCustomerProfile(user.uid);

  const profile: CustomerProfile = {
    uid: user.uid,
    fullName,
    email:
      user.email?.trim() || "",
    phone,
    district:
      district || undefined,
    createdAt:
      existing?.createdAt || now,
    updatedAt: now,
  };

  await setDoc(
    doc(
      db,
      COLLECTIONS.customers,
      user.uid,
    ),
    profile,
    {
      merge: true,
    },
  );

  if (
    user.displayName?.trim() !==
    fullName
  ) {
    await updateProfile(
      user,
      {
        displayName: fullName,
      },
    );

    await user.reload();
  }

  window.dispatchEvent(
    new CustomEvent(
      "customer-profile-changed",
      {
        detail: profile,
      },
    ),
  );

  return profile;
}