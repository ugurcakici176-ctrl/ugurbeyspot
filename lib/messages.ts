import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  COLLECTIONS,
  CONTACT_LIMITS,
} from "@/lib/constants";
import { auth, db } from "@/lib/firebase";
import type {
  ContactChatMessage,
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

export interface CustomerChatMessageInput {
  chatId?: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
  sourcePage?: string;
  adminNotificationEmail?: string;
}

export interface AdminReplyResult {
  customerActive: boolean;
  emailed: boolean;
}

const MAIL_COLLECTION = "mail";
const CHAT_MESSAGES_SUBCOLLECTION = "messages";
const ACTIVE_CUSTOMER_WINDOW_MS = 60_000;

function toIsoDate(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
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

function toMillis(value: unknown): number {
  const iso = toIsoDate(value);
  const parsed = Date.parse(iso);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function mapMessage(
  id: string,
  data: unknown,
): ContactMessage {
  const source = data as Record<string, unknown>;

  return {
    id,
    fullName: typeof source.fullName === "string" ? source.fullName : "Musteri",
    phone: typeof source.phone === "string" ? source.phone : "",
    email: typeof source.email === "string" ? source.email : undefined,
    subject: typeof source.subject === "string" ? source.subject : "Canli Sohbet",
    message:
      typeof source.message === "string"
        ? source.message
        : typeof source.lastMessage === "string"
          ? source.lastMessage
          : "",
    status:
      source.status === "new" ||
      source.status === "read" ||
      source.status === "answered" ||
      source.status === "replied"
        ? source.status
        : "new",
    adminReply:
      typeof source.adminReply === "string" ? source.adminReply : undefined,
    repliedAt:
      source.repliedAt !== undefined ? toIsoDate(source.repliedAt) : undefined,
    customerUid:
      typeof source.customerUid === "string" ? source.customerUid : undefined,
    customerOnline:
      typeof source.customerOnline === "boolean"
        ? source.customerOnline
        : undefined,
    lastCustomerSeenAt:
      source.lastCustomerSeenAt !== undefined
        ? toIsoDate(source.lastCustomerSeenAt)
        : undefined,
    adminNotified:
      typeof source.adminNotified === "boolean"
        ? source.adminNotified
        : undefined,
    lastMessage:
      typeof source.lastMessage === "string" ? source.lastMessage : undefined,
    lastMessageAt:
      source.lastMessageAt !== undefined
        ? toIsoDate(source.lastMessageAt)
        : undefined,
    lastSender:
      source.lastSender === "admin" || source.lastSender === "customer"
        ? source.lastSender
        : undefined,
    sourcePage:
      typeof source.sourcePage === "string" ? source.sourcePage : undefined,
    userAgent:
      typeof source.userAgent === "string" ? source.userAgent : undefined,
    createdAt: toIsoDate(source.createdAt),
    updatedAt: toIsoDate(source.updatedAt),
  };
}

function mapChatMessage(
  id: string,
  data: unknown,
): ContactChatMessage {
  const source = data as Record<string, unknown>;

  return {
    id,
    text: typeof source.text === "string" ? source.text : "",
    sender: source.sender === "admin" ? "admin" : "customer",
    createdAt: toIsoDate(source.createdAt),
    read: Boolean(source.read),
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
  const created = doc(collection(db, COLLECTIONS.contactMessages));
  const messageRef = doc(
    collection(created, CHAT_MESSAGES_SUBCOLLECTION),
  );
  const currentUser = auth.currentUser;

  const batch = writeBatch(db);

  batch.set(
    created,
    stripUndefined({
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "new" as const,
      sourcePage: input.sourcePage,
      customerUid: currentUser?.uid,
      customerOnline: false,
      lastCustomerSeenAt: now,
      adminNotified: false,
      lastMessage: input.message.trim(),
      lastMessageAt: now,
      lastSender: "customer" as const,
      userAgent:
        typeof navigator !== "undefined"
          ? navigator.userAgent.slice(0, 500)
          : undefined,
      createdAt: now,
      updatedAt: now,
    }),
  );

  batch.set(messageRef, {
    text: input.message.trim(),
    sender: "customer",
    createdAt: now,
    read: false,
  });

  await batch.commit();

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
      (b.lastMessageAt || b.createdAt).localeCompare(
        a.lastMessageAt || a.createdAt,
      ),
    );
}

export function observeContactMessages(
  callback: (items: ContactMessage[]) => void,
  onError?: (reason: unknown) => void,
): () => void {
  return onSnapshot(
    collection(db, COLLECTIONS.contactMessages),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => mapMessage(item.id, item.data()))
        .sort((a, b) =>
          (b.lastMessageAt || b.createdAt).localeCompare(
            a.lastMessageAt || a.createdAt,
          ),
        );

      callback(items);
    },
    (reason) => {
      onError?.(reason);
    },
  );
}

export function observeContactChatMessages(
  chatId: string,
  callback: (items: ContactChatMessage[]) => void,
  onError?: (reason: unknown) => void,
): () => void {
  return onSnapshot(
    collection(
      db,
      COLLECTIONS.contactMessages,
      chatId,
      CHAT_MESSAGES_SUBCOLLECTION,
    ),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => mapChatMessage(item.id, item.data()))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      callback(items);
    },
    (reason) => {
      onError?.(reason);
    },
  );
}

export async function findLatestCustomerChat(
  customerUid: string,
): Promise<ContactMessage | null> {
  const chatQuery = query(
    collection(db, COLLECTIONS.contactMessages),
    where("customerUid", "==", customerUid),
    limit(10),
  );

  const snapshot = await getDocs(chatQuery);

  const sorted = snapshot.docs
    .map((item) => mapMessage(item.id, item.data()))
    .sort((a, b) =>
      (b.lastMessageAt || b.createdAt).localeCompare(
        a.lastMessageAt || a.createdAt,
      ),
    );

  return sorted[0] || null;
}

export async function setCustomerChatPresence(
  chatId: string,
  online: boolean,
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.contactMessages, chatId),
    {
      customerOnline: online,
      lastCustomerSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

function isCustomerActive(chat: ContactMessage): boolean {
  if (!chat.customerOnline) {
    return false;
  }

  if (!chat.lastCustomerSeenAt) {
    return false;
  }

  return Date.now() - toMillis(chat.lastCustomerSeenAt) <= ACTIVE_CUSTOMER_WINDOW_MS;
}

export async function sendCustomerChatMessage(
  input: CustomerChatMessageInput,
): Promise<{ chatId: string; adminEmailed: boolean }> {
  const text = input.message.trim();

  if (!input.customerUid.trim()) {
    throw new Error("Musteri oturumu bulunamadi.");
  }

  if (!text) {
    throw new Error("Mesaj bos olamaz.");
  }

  if (text.length > CONTACT_LIMITS.messageMaxLength) {
    throw new Error("Mesaj alanı çok uzun.");
  }

  const now = new Date().toISOString();
  let chatId = input.chatId?.trim() || "";
  let existingChat: ContactMessage | null = null;

  if (chatId) {
    const snapshot = await getDoc(
      doc(db, COLLECTIONS.contactMessages, chatId),
    );

    if (snapshot.exists()) {
      existingChat = mapMessage(snapshot.id, snapshot.data());
    } else {
      chatId = "";
    }
  }

  if (!chatId) {
    const latest = await findLatestCustomerChat(input.customerUid);

    if (latest) {
      chatId = latest.id;
      existingChat = latest;
    }
  }

  const chatRef = chatId
    ? doc(db, COLLECTIONS.contactMessages, chatId)
    : doc(collection(db, COLLECTIONS.contactMessages));

  if (!chatId) {
    chatId = chatRef.id;
  }

  const shouldNotifyAdmin =
    !existingChat?.adminNotified &&
    Boolean(input.adminNotificationEmail?.trim()) &&
    isValidEmail(input.adminNotificationEmail || "");

  const batch = writeBatch(db);
  const messageRef = doc(
    collection(chatRef, CHAT_MESSAGES_SUBCOLLECTION),
  );

  if (!existingChat) {
    batch.set(
      chatRef,
      stripUndefined({
        fullName: input.customerName.trim() || "Musteri",
        phone: input.customerPhone?.trim() || "Hesaptan iletildi",
        email: input.customerEmail.trim(),
        subject: "Canli sohbet",
        message: text,
        status: "new" as const,
        customerUid: input.customerUid.trim(),
        customerOnline: true,
        lastCustomerSeenAt: serverTimestamp(),
        adminNotified: shouldNotifyAdmin,
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastSender: "customer" as const,
        sourcePage: input.sourcePage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  } else {
    batch.update(chatRef, {
      fullName: input.customerName.trim() || existingChat.fullName,
      phone: input.customerPhone?.trim() || existingChat.phone,
      email: input.customerEmail.trim() || existingChat.email,
      status: "new",
      customerOnline: true,
      lastCustomerSeenAt: serverTimestamp(),
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastSender: "customer",
      updatedAt: serverTimestamp(),
      ...(shouldNotifyAdmin ? { adminNotified: true } : {}),
    });
  }

  batch.set(messageRef, {
    text,
    sender: "customer",
    createdAt: serverTimestamp(),
    read: false,
  });

  if (shouldNotifyAdmin) {
    const mailRef = doc(collection(db, MAIL_COLLECTION));

    batch.set(mailRef, {
      to: [input.adminNotificationEmail?.trim()],
      message: {
        subject: "Uğurbey Spot | Yeni canlı sohbet mesajı",
        html: `<p>Yeni bir canli sohbet mesaji alindi.</p><p><strong>${input.customerName}</strong></p><p>${text}</p>`,
      },
      createdAt: now,
      source: "customer_chat_first_message",
      chatId,
    });
  }

  await batch.commit();

  return {
    chatId,
    adminEmailed: shouldNotifyAdmin,
  };
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
): Promise<AdminReplyResult> {
  const normalizedReply = reply.trim();

  if (!normalizedReply) {
    throw new Error("Yanıt metni boş olamaz.");
  }

  if (normalizedReply.length > 2000) {
    throw new Error("Yanıt metni en fazla 2000 karakter olabilir.");
  }

  const chatSnapshot = await getDoc(
    doc(db, COLLECTIONS.contactMessages, id),
  );

  if (!chatSnapshot.exists()) {
    throw new Error("Sohbet bulunamadi.");
  }

  const chat = mapMessage(chatSnapshot.id, chatSnapshot.data());
  const customerActive = isCustomerActive(chat);
  const customerEmail = chat.email?.trim() || "";
  const shouldEmailCustomer =
    !customerActive && isValidEmail(customerEmail);

  const chatRef = doc(db, COLLECTIONS.contactMessages, id);
  const messageRef = doc(
    collection(chatRef, CHAT_MESSAGES_SUBCOLLECTION),
  );
  const batch = writeBatch(db);

  batch.set(messageRef, {
    text: normalizedReply,
    sender: "admin",
    createdAt: serverTimestamp(),
    read: false,
  });

  batch.update(chatRef, {
    status: "answered",
    adminReply: normalizedReply,
    repliedAt: serverTimestamp(),
    lastMessage: normalizedReply,
    lastMessageAt: serverTimestamp(),
    lastSender: "admin",
    updatedAt: serverTimestamp(),
  });

  if (shouldEmailCustomer) {
    const mailRef = doc(collection(db, MAIL_COLLECTION));
    const name = chat.fullName.trim() || "Musteri";

    batch.set(mailRef, {
      to: [customerEmail],
      message: {
        subject: "Uğurbey Spot | Mesajiniza yanit",
        html: `<p>Merhaba ${name},</p><p>${normalizedReply}</p>`,
      },
      createdAt: new Date().toISOString(),
      source: "admin_chat_reply",
      chatId: id,
    });
  }

  await batch.commit();

  return {
    customerActive,
    emailed: shouldEmailCustomer,
  };
}

export async function deleteContactMessage(
  id: string,
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTIONS.contactMessages, id),
  );
}
