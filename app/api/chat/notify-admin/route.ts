import {
  NextRequest,
  NextResponse,
} from "next/server";

import { COLLECTIONS, DOCUMENTS } from "@/lib/constants";
import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import {
  getAdminAuth,
  getAdminDb,
} from "@/lib/firebase-admin";
import {
  isValidEmail,
  TRANSACTIONAL_MAIL_FROM,
} from "@/lib/server/email-verification";
import { escapeHtml } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRecord = {
  customerUid?: string;
  adminNotified?: boolean;
  fullName?: string;
  email?: string;
  lastMessage?: string;
  message?: string;
};

function getTokenFromHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [schema, token] = value.trim().split(/\s+/);

  if (schema?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

// Müşterinin ilk canlı sohbet mesajında yöneticiye tek seferlik e-posta gönderir.
// Alıcı ve içerik sunucuda belirlenir; istemci mail koleksiyonuna yazamaz.
export async function POST(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ ok: false, error: "Yetkisiz istek." }, { status: 401 });
  }

  let chatId = "";

  try {
    const body = (await request.json()) as { chatId?: unknown };
    chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
  } catch {
    // aşağıda doğrulanır
  }

  if (!chatId || chatId.length > 128 || chatId.includes("/")) {
    return NextResponse.json({ ok: false, error: "Gecersiz sohbet." }, { status: 400 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const chatRef = db.collection(COLLECTIONS.contactMessages).doc(chatId);
    const settingsRef = db
      .collection(COLLECTIONS.siteSettings)
      .doc(DOCUMENTS.siteSettings);

    const notified = await db.runTransaction(async (transaction) => {
      const [chatSnapshot, settingsSnapshot] = await Promise.all([
        transaction.get(chatRef),
        transaction.get(settingsRef),
      ]);

      if (!chatSnapshot.exists) {
        return "missing" as const;
      }

      const chat = chatSnapshot.data() as ChatRecord;

      if (chat.customerUid !== decoded.uid) {
        return "forbidden" as const;
      }

      if (chat.adminNotified === true) {
        return false;
      }

      const configuredEmail = (
        settingsSnapshot.get("contact.email") as string | undefined
      )?.trim();
      const adminEmail = configuredEmail || DEFAULT_SITE_SETTINGS.contact.email;

      if (!adminEmail || !isValidEmail(adminEmail)) {
        return false;
      }

      const name = escapeHtml((chat.fullName || "Musteri").slice(0, 120));
      const email = escapeHtml((chat.email || "").slice(0, 160));
      const text = escapeHtml((chat.lastMessage || chat.message || "").slice(0, 3000));

      transaction.update(chatRef, { adminNotified: true });
      transaction.create(db.collection("mail").doc(), {
        to: [adminEmail],
        message: {
          from: TRANSACTIONAL_MAIL_FROM,
          subject: "Uğurbey Spot | Yeni canlı sohbet mesajı",
          html: `<p>Yeni bir canlı sohbet mesajı alındı.</p><p><strong>${name}</strong>${email ? ` &lt;${email}&gt;` : ""}</p><p style="white-space:pre-wrap">${text}</p>`,
        },
        createdAt: new Date().toISOString(),
        source: "customer_chat_first_message",
        chatId,
      });

      return true;
    });

    if (notified === "missing") {
      return NextResponse.json({ ok: false, error: "Sohbet bulunamadi." }, { status: 404 });
    }

    if (notified === "forbidden") {
      return NextResponse.json({ ok: false, error: "Bu sohbet size ait degil." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, notified });
  } catch (error: unknown) {
    console.error("[chat-notify-admin] request failed", error);
    return NextResponse.json(
      { ok: false, error: "Bildirim gonderilemedi." },
      { status: 500 },
    );
  }
}
