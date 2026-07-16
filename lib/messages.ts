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
} from "@/lib/constants";
import { auth, db } from "@/lib/firebase";
import type {
  ContactMessage,
  MessageStatus,
} from "@/lib/types";
import {
  isValidEmail,
  stripUndefined,
} from "@/lib/utils";

export interface ContactMessageInput {
  fullName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  sourcePage?: string;
}

function mapMessage(
  id: string,
  data: unknown,
): ContactMessage {
  return {
    id,
    ...(data as Omit<ContactMessage, "id">),
  };
}

function validateMessageInput(
  input: ContactMessageInput,
): void {
  if (!input.fullName.trim()) {
    throw new Error("Ad soyad alanı zorunludur.");
  }

  if (
    input.fullName.trim().length >
    CONTACT_LIMITS.fullNameMaxLength
  ) {
    throw new Error("Ad soyad alanı çok uzun.");
  }

  if (!input.phone.trim()) {
    throw new Error("Telefon alanı zorunludur.");
  }

  if (
    input.phone.trim().length >
    CONTACT_LIMITS.phoneMaxLength
  ) {
    throw new Error("Telefon alanı çok uzun.");
  }

  if (
    input.email?.trim() &&
    (!isValidEmail(input.email) ||
      input.email.length > CONTACT_LIMITS.emailMaxLength)
  ) {
    throw new Error("Geçerli bir e-posta adresi girin.");
  }

  if (!input.subject.trim()) {
    throw new Error("Konu alanı zorunludur.");
  }

  if (
    input.subject.trim().length >
    CONTACT_LIMITS.subjectMaxLength
  ) {
    throw new Error("Konu alanı çok uzun.");
  }

  if (!input.message.trim()) {
    throw new Error("Mesaj alanı zorunludur.");
  }

  if (
    input.message.trim().length >
    CONTACT_LIMITS.messageMaxLength
  ) {
    throw new Error("Mesaj alanı çok uzun.");
  }
}

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<string> {
  validateMessageInput(input);

  const now = new Date().toISOString();

  const payload = stripUndefined({
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: "new" as const,
    sourcePage: input.sourcePage,
    userAgent:
      typeof navigator !== "undefined"
        ? navigator.userAgent.slice(0, 500)
        : undefined,
    createdAt: now,
    updatedAt: now,
  });

  const created = await addDoc(
    collection(db, COLLECTIONS.contactMessages),
    payload,
  );

  return created.id;
}

export async function getContactMessages(): Promise<
  ContactMessage[]
> {
  const snapshot = await getDocs(
    collection(db, COLLECTIONS.contactMessages),
  );

  return snapshot.docs
    .map((item) => mapMessage(item.id, item.data()))
    .sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.contactMessages, id),
    {
      status,
      updatedAt: new Date().toISOString(),
    },
  );
}

export async function replyToContactMessage(
  id: string,
  reply: string,
): Promise<{ queued: boolean; mailId?: string }> {
  const normalizedReply = reply.trim();

  if (!normalizedReply) {
    throw new Error("Yanıt metni boş olamaz.");
  }

  if (normalizedReply.length > 2000) {
    throw new Error("Yanıt metni en fazla 2000 karakter olabilir.");
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Oturum bulunamadi. Lutfen tekrar giris yapin.");
  }

  const idToken = await user.getIdToken();

  const response = await fetch("/api/contact/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      messageId: id,
      reply: normalizedReply,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        queued?: boolean;
        mailId?: string;
      }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Yanit gonderilemedi.");
  }

  return {
    queued: Boolean(payload.queued),
    mailId: typeof payload.mailId === "string" ? payload.mailId : undefined,
  };
}

export async function deleteContactMessage(
  id: string,
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTIONS.contactMessages, id),
  );
}
