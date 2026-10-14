import "server-only";

import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

const RATE_LIMIT_COLLECTION = "rate_limits";

export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("RATE_LIMITED");
  }
}

/**
 * İstemci IP'si. App Hosting / Cloud Run önündeki yük dengeleyici gerçek IP'yi
 * X-Forwarded-For listesinin başına yazar.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Sabit pencereli sayaç (Firestore, sunucu-only koleksiyon). Sınır aşılırsa
 * RateLimitError fırlatır. Belgeler expireAt alanıyla TTL politikasına uygundur.
 */
export async function enforceRateLimit(input: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<void> {
  const db = getAdminDb();
  const id = createHash("sha256")
    .update(`${input.scope}:${input.key}`)
    .digest("hex");
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(id);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const windowStart = snapshot.get("windowStartMs");
    const count = snapshot.get("count");
    const active =
      typeof windowStart === "number" && now - windowStart < input.windowMs;

    if (active && typeof count === "number" && count >= input.limit) {
      throw new RateLimitError(
        Math.max(1, Math.ceil((windowStart + input.windowMs - now) / 1000)),
      );
    }

    const startMs = active ? windowStart : now;

    transaction.set(ref, {
      scope: input.scope,
      windowStartMs: startMs,
      count: active && typeof count === "number" ? count + 1 : 1,
      expireAt: Timestamp.fromMillis(startMs + input.windowMs),
    });
  });
}

export function rateLimitMessage(error: RateLimitError): string {
  const minutes = Math.ceil(error.retryAfterSeconds / 60);

  return minutes > 1
    ? `Cok fazla istek gonderildi. Lutfen ${minutes} dakika sonra tekrar deneyin.`
    : "Cok fazla istek gonderildi. Lutfen biraz sonra tekrar deneyin.";
}

/**
 * Route handler'lar için: IP başına sınırı uygular; aşıldıysa 429 yanıtı döner,
 * aksi halde null. Sayaç okunamazsa (Firestore hatası) istek engellenmez.
 */
export async function limitByIp(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<Response | null> {
  try {
    await enforceRateLimit({ scope, key: getClientIp(request), limit, windowMs });
    return null;
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { ok: false, error: rateLimitMessage(error) },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }

    console.error(`[rate-limit:${scope}] check failed`, error);
    return null;
  }
}
