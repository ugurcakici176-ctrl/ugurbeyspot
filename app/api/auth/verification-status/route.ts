import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  getEmailVerificationKey,
  isValidEmail,
  normalizeEmail,
} from "@/lib/server/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const emailValue = request.nextUrl.searchParams.get("email");

  if (!emailValue) {
    return NextResponse.json(
      { ok: false, error: "Gecersiz istek." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(emailValue);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Gecersiz e-posta." },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();

    const snapshot = await db
      .collection("email_verifications")
      .doc(getEmailVerificationKey(email, "register"))
      .get();

    const verified = snapshot.exists
      ? snapshot.get("verified") === true
      : false;

    return NextResponse.json({
      ok: true,
      verified,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Durum okunamadi." },
      { status: 500 },
    );
  }
}
