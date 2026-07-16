import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getAdminAuth,
  getAdminDb,
} from "@/lib/firebase-admin";
import { TRANSACTIONAL_MAIL_FROM } from "@/lib/server/email-verification";
import { isValidEmail } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReplyBody = {
  messageId?: unknown;
  reply?: unknown;
};

type ContactMessageRecord = {
  email?: string;
  fullName?: string;
  subject?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

function isAllowedRole(value: unknown): boolean {
  return value === "super_admin" || value === "admin" || value === "editor";
}

function buildReplyMailHtml(fullName: string, reply: string): string {
  const safeName = escapeHtml(fullName.trim() || "Degerli musterimiz");
  const safeReply = escapeHtml(reply);

  return `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Uğurbey Spot Mesaj Yaniti</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f3;font-family:Segoe UI,Arial,sans-serif;color:#181817;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(24,24,23,.1);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:24px 24px 18px;background:linear-gradient(135deg,#fff3a8,#f4d84c 55%,#e2b100);">
              <div style="display:inline-block;padding:8px 12px;background:#181817;color:#fff;border-radius:10px;font-weight:700;letter-spacing:.04em;">Uğurbey Spot</div>
              <h1 style="margin:16px 0 0;font-size:26px;line-height:1.15;letter-spacing:-.03em;color:#181817;">Mesajiniza Yanit</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 24px 18px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4c4c46;">Merhaba ${safeName},</p>
              <div style="margin:8px 0 16px;padding:16px 14px;border-radius:14px;border:1px solid rgba(154,119,0,.32);background:#fffbe9;font-size:14px;line-height:1.7;white-space:pre-wrap;color:#2f2f2a;">${safeReply}</div>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#707067;">Sorulariniz icin bu e-postayi yanitlayabilir veya iletisim sayfamizdan tekrar yazabilirsiniz.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid rgba(24,24,23,.08);font-size:12px;color:#8a8a83;line-height:1.6;">Bu e-posta otomatik olarak gonderilmistir.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export async function POST(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ ok: false, error: "Yetkisiz istek." }, { status: 401 });
  }

  let body: ReplyBody;

  try {
    body = (await request.json()) as ReplyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Gecersiz istek govdesi." }, { status: 400 });
  }

  if (typeof body.messageId !== "string" || typeof body.reply !== "string") {
    return NextResponse.json({ ok: false, error: "Gecersiz yanit verisi." }, { status: 400 });
  }

  const messageId = body.messageId.trim();
  const reply = body.reply.trim();

  if (!messageId) {
    return NextResponse.json({ ok: false, error: "Mesaj kimligi zorunludur." }, { status: 400 });
  }

  if (!reply) {
    return NextResponse.json({ ok: false, error: "Yanit metni bos olamaz." }, { status: 400 });
  }

  if (reply.length > 2000) {
    return NextResponse.json({ ok: false, error: "Yanit en fazla 2000 karakter olabilir." }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const decoded = await auth.verifyIdToken(token, true);

    const adminRef = db.collection("admins").doc(decoded.uid);
    const adminSnapshot = await adminRef.get();

    if (!adminSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Admin yetkisi bulunamadi." }, { status: 403 });
    }

    const adminData = adminSnapshot.data();

    if (adminData?.status !== "active" || !isAllowedRole(adminData?.role)) {
      return NextResponse.json({ ok: false, error: "Bu islem icin yetkiniz yok." }, { status: 403 });
    }

    const messageRef = db.collection("contact_messages").doc(messageId);
    const messageSnapshot = await messageRef.get();

    if (!messageSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Mesaj bulunamadi." }, { status: 404 });
    }

    const messageData = messageSnapshot.data() as ContactMessageRecord;
    const now = new Date().toISOString();

    const recipientEmail = (messageData.email || "").trim();

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bu mesaja yanit gonderilemez: gecerli bir e-posta adresi bulunamadi.",
        },
        { status: 400 },
      );
    }

    const name = (messageData.fullName || "").trim();
    const messageSubject = (messageData.subject || "").trim();
    const mailRef = db.collection("mail").doc();
    const batch = db.batch();

    batch.update(messageRef, {
      status: "replied",
      adminReply: reply,
      repliedAt: now,
      updatedAt: now,
    });

    batch.set(mailRef, {
      to: [recipientEmail],
      message: {
        from: TRANSACTIONAL_MAIL_FROM,
        subject: messageSubject
          ? `Uğurbey Spot | ${messageSubject} yaniti`
          : "Uğurbey Spot | Mesajiniza yanit",
        html: buildReplyMailHtml(name, reply),
      },
      metadata: {
        source: "admin_contact_reply",
        messageId,
        queuedAt: now,
      },
    });

    await batch.commit();

    return NextResponse.json({ ok: true, queued: true, mailId: mailRef.id });
  } catch (error: unknown) {
    console.error("[contact-reply] request failed", error);
    return NextResponse.json(
      { ok: false, error: "Yanit su an gonderilemedi. Lutfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
