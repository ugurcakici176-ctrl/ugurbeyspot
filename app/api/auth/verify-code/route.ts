import {
  NextRequest,
  NextResponse,
} from "next/server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
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

type VerifyCodeBody = {
  email?: unknown;
  code?: unknown;
};

const GENERIC_VERIFY_ERROR = "Kod dogrulanamadi. Lutfen tekrar deneyin.";

export async function POST(request: NextRequest) {
  let body: VerifyCodeBody;

  try {
    body = (await request.json()) as VerifyCodeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gecersiz istek." },
      { status: 400 },
    );
  }

  if (typeof body.email !== "string" || typeof body.code !== "string") {
    return NextResponse.json(
      { ok: false, error: "Gecersiz istek." },
      { status: 400 },
    );
  }

  const normalizedEmail = normalizeEmail(body.email);
  const normalizedCode = body.code.trim();

  if (!isValidEmail(normalizedEmail) || !isValidVerificationCode(normalizedCode)) {
    return NextResponse.json(
      { ok: false, error: GENERIC_VERIFY_ERROR },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const verificationRef = db
      .collection("email_verifications")
      .doc(getEmailVerificationKey(normalizedEmail, "register"));

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(verificationRef);

      if (!snapshot.exists) {
        return { ok: false, status: 400 as const };
      }

      const data = snapshot.data();

      if (!data) {
        return { ok: false, status: 400 as const };
      }

      if (data.verified === true) {
        return { ok: true, status: 200 as const };
      }

      const expiresAt = data.expiresAt;
      const attempts = typeof data.attempts === "number" ? data.attempts : 0;
      const providedHash = sha256(`${normalizedEmail}:${normalizedCode}`);
      const storedHash = typeof data.codeHash === "string" ? data.codeHash : "";

      const expired =
        typeof expiresAt?.toMillis === "function" &&
        Date.now() > expiresAt.toMillis();

      if (expired || attempts >= EMAIL_VERIFY_MAX_ATTEMPTS || storedHash !== providedHash) {
        transaction.set(
          verificationRef,
          {
            attempts: expired || attempts >= EMAIL_VERIFY_MAX_ATTEMPTS ? attempts : attempts + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return { ok: false, status: 400 as const };
      }

      transaction.set(
        verificationRef,
        {
          verified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          attempts: 0,
        },
        { merge: true },
      );

      return { ok: true, status: 200 as const };
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: GENERIC_VERIFY_ERROR },
        { status: result.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    console.error("[verify-code] request failed");

    return NextResponse.json(
      { ok: false, error: GENERIC_VERIFY_ERROR },
      { status: 500 },
    );
  }
}
