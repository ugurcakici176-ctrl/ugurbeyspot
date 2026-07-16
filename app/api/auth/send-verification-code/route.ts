import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  buildVerificationEmailHtml,
  EMAIL_CODE_TTL_MS,
  EMAIL_RESEND_LIMIT_MS,
  generateVerificationCode,
  getEmailVerificationKey,
  isValidEmail,
  normalizeEmail,
  sha256,
  TRANSACTIONAL_MAIL_FROM,
} from "@/lib/server/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SendVerificationBody = {
  email?: unknown;
};

const GENERIC_ERROR_MESSAGE = "Islem su an tamamlanamadi. Lutfen tekrar deneyin.";

function getRemainingSeconds(lastSentAtMs: number): number {
  const diff = EMAIL_RESEND_LIMIT_MS - (Date.now() - lastSentAtMs);

  return Math.max(0, Math.ceil(diff / 1000));
}

export async function POST(request: NextRequest) {
  let body: SendVerificationBody;

  try {
    body = (await request.json()) as SendVerificationBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gecersiz istek." },
      { status: 400 },
    );
  }

  if (typeof body.email !== "string") {
    return NextResponse.json(
      { ok: false, error: "Gecersiz istek." },
      { status: 400 },
    );
  }

  const normalizedEmail = normalizeEmail(body.email);

  if (!isValidEmail(normalizedEmail)) {
    return NextResponse.json(
      { ok: false, error: "Gecerli bir e-posta adresi girin." },
      { status: 400 },
    );
  }

  const code = generateVerificationCode();
  const codeHash = sha256(`${normalizedEmail}:${code}`);

  try {
    const db = getAdminDb();
    const docId = getEmailVerificationKey(normalizedEmail, "register");
    const verificationRef = db.collection("email_verifications").doc(docId);

    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(verificationRef);

      if (existing.exists) {
        const data = existing.data();
        const lastSentAt = data?.lastSentAt as Timestamp | undefined;

        if (lastSentAt && Date.now() - lastSentAt.toMillis() < EMAIL_RESEND_LIMIT_MS) {
          const error = new Error("RATE_LIMIT");
          (error as Error & { lastSentAtMs?: number }).lastSentAtMs = lastSentAt.toMillis();
          throw error;
        }
      }

      transaction.set(
        verificationRef,
        {
          email: normalizedEmail,
          purpose: "register",
          codeHash,
          verified: false,
          verifiedAt: null,
          expiresAt: Timestamp.fromMillis(Date.now() + EMAIL_CODE_TTL_MS),
          attempts: 0,
          lastSentAt: Timestamp.now(),
          createdAt: existing.exists ? existing.get("createdAt") ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    await db.collection("mail").add({
      to: [normalizedEmail],
      message: {
        from: TRANSACTIONAL_MAIL_FROM,
        subject: "Uğurbey Spot doğrulama kodunuz",
        html: buildVerificationEmailHtml(code),
      },
    });

    return NextResponse.json({
      ok: true,
      cooldownSeconds: Math.ceil(EMAIL_RESEND_LIMIT_MS / 1000),
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "RATE_LIMIT" &&
      typeof (error as Error & { lastSentAtMs?: number }).lastSentAtMs === "number"
    ) {
      const seconds = getRemainingSeconds((error as Error & { lastSentAtMs?: number }).lastSentAtMs as number);

      return NextResponse.json(
        {
          ok: false,
          error: `Lutfen ${seconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 },
      );
    }

    console.error("[send-verification-code] request failed");

    return NextResponse.json(
      { ok: false, error: GENERIC_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
