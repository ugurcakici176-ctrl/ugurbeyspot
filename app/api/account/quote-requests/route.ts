import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Timestamp } from "firebase-admin/firestore";

import { COLLECTIONS } from "@/lib/constants";
import {
  getAdminAuth,
  getAdminDb,
} from "@/lib/firebase-admin";
import {
  getEmailVerificationKey,
  normalizeEmail,
} from "@/lib/server/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function serialize(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  }

  return value;
}

// Müşterinin kendi e-postasıyla gönderdiği hızlı teklifleri döner.
// E-posta sahipliği (Firebase doğrulaması veya kayıt kodu) kanıtlanmadan liste verilmez.
export async function GET(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json({ ok: false, error: "Yetkisiz istek." }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = typeof decoded.email === "string" ? decoded.email.trim() : "";

    if (!email) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const db = getAdminDb();
    let verified = decoded.email_verified === true;

    if (!verified) {
      const verification = await db
        .collection("email_verifications")
        .doc(getEmailVerificationKey(email, "register"))
        .get();

      verified = verification.exists && verification.get("verified") === true;
    }

    if (!verified) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const emails = Array.from(new Set([email, normalizeEmail(email)]));
    const snapshot = await db
      .collection(COLLECTIONS.quoteRequests)
      .where("email", "in", emails)
      .get();

    const items = snapshot.docs.map((item) => {
      const data = serialize(item.data()) as Record<string, unknown>;
      // Yönetici notu müşteriye gösterilmez.
      delete data.adminNote;
      delete data.tracking;
      return { id: item.id, data };
    });

    return NextResponse.json({ ok: true, items });
  } catch (error: unknown) {
    console.error("[account-quote-requests] request failed", error);
    return NextResponse.json(
      { ok: false, error: "Teklifler yuklenemedi." },
      { status: 500 },
    );
  }
}
