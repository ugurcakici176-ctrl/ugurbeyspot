import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  getEmailVerificationKey,
  isValidEmail,
  normalizeEmail,
} from "@/lib/server/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const [schema, token] = (request.headers.get("authorization") || "")
    .trim()
    .split(/\s+/);

  if (schema?.toLowerCase() !== "bearer" || !token) {
    return NextResponse.json(
      { ok: false, error: "Yetkisiz istek." },
      { status: 401 },
    );
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = normalizeEmail(decoded.email || "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: true, verified: false });
    }

    const snapshot = await getAdminDb()
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
