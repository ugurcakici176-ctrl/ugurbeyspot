import {
  NextRequest,
  NextResponse,
} from "next/server";

import { FieldValue } from "firebase-admin/firestore";

import {
  getAdminAuth,
  getAdminDb,
} from "@/lib/firebase-admin";
import {
  EMAIL_VERIFY_MAX_ATTEMPTS,
  getEmailVerificationKey,
  isValidEmail,
  isValidVerificationCode,
  normalizeEmail,
  sha256,
} from "@/lib/server/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResetPasswordBody = {
  email?: unknown;
  code?: unknown;
  newPassword?: unknown;
};

const GENERIC_ERROR = "Islem tamamlanamadi. Lutfen bilgileri kontrol edip tekrar deneyin.";

export async function POST(request: NextRequest) {
  let body: ResetPasswordBody;

  try {
    body = (await request.json()) as ResetPasswordBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Gecersiz istek." }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    typeof body.code !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Gecersiz istek." }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(body.email);
  const code = body.code.trim();
  const newPassword = body.newPassword;

  if (
    !isValidEmail(normalizedEmail) ||
    !isValidVerificationCode(code) ||
    newPassword.length < 8
  ) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();
  const verificationRef = db
    .collection("email_verifications")
    .doc(getEmailVerificationKey(normalizedEmail, "password_reset"));

  try {
    const verification = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(verificationRef);

      if (!snapshot.exists) {
        return { ok: false as const };
      }

      const data = snapshot.data();

      if (!data) {
        return { ok: false as const };
      }

      const expiresAt = data.expiresAt;
      const attempts = typeof data.attempts === "number" ? data.attempts : 0;
      const storedHash = typeof data.codeHash === "string" ? data.codeHash : "";
      const expectedHash = sha256(`${normalizedEmail}:${code}`);
      const expired = typeof expiresAt?.toMillis === "function" && Date.now() > expiresAt.toMillis();

      if (expired || attempts >= EMAIL_VERIFY_MAX_ATTEMPTS || storedHash !== expectedHash) {
        transaction.set(
          verificationRef,
          {
            attempts: expired || attempts >= EMAIL_VERIFY_MAX_ATTEMPTS ? attempts : attempts + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return { ok: false as const };
      }

      transaction.set(
        verificationRef,
        {
          verified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          attempts: 0,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return { ok: true as const };
    });

    if (!verification.ok) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
    }

    const user = await auth.getUserByEmail(normalizedEmail);
    await auth.updateUser(user.uid, { password: newPassword });

    return NextResponse.json({ ok: true });
  } catch {
    console.error("[reset-password-with-code] request failed");
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
