import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const BOT_PATTERN =
  /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|slurp|facebookexternalhit/i;

function istanbulDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function cleanPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;

  const path = value.split("?")[0].slice(0, 180);
  return path.startsWith("/admin") || path.startsWith("/api") ? null : path;
}

function pathKey(path: string): string {
  return Buffer.from(path).toString("base64url");
}

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";

  if (BOT_PATTERN.test(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  let input: {
    visitorId?: unknown;
    path?: unknown;
    referrer?: unknown;
    pageView?: unknown;
  };

  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const visitorId =
    typeof input.visitorId === "string" &&
    /^[a-f0-9-]{20,50}$/i.test(input.visitorId)
      ? input.visitorId
      : null;
  const path = cleanPath(input.path);

  if (!visitorId || !path) {
    return NextResponse.json({ error: "Geçersiz analitik verisi." }, { status: 400 });
  }

  const db = getAdminDb();
  const date = istanbulDate();
  const sessionRef = db.collection("analytics_sessions").doc(`${date}_${visitorId}`);
  const dailyRef = db.collection("analytics_daily").doc(date);
  const now = Timestamp.now();
  const pageView = input.pageView === true;

  await db.runTransaction(async (transaction) => {
    const [sessionSnapshot, dailySnapshot] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(dailyRef),
    ]);

    const previous = sessionSnapshot.data();
    const previousSeen = previous?.lastSeenAt;

    if (
      !pageView &&
      previousSeen instanceof Timestamp &&
      now.toMillis() - previousSeen.toMillis() < 10_000
    ) {
      return;
    }

    transaction.set(
      sessionRef,
      {
        date,
        visitorId,
        lastPath: path,
        lastSeenAt: now,
        ...(sessionSnapshot.exists ? {} : { firstSeenAt: now }),
        ...(pageView ? { pageViews: FieldValue.increment(1) } : {}),
      },
      { merge: true },
    );

    const daily = dailySnapshot.data() || {};
    const topPaths = { ...(daily.topPaths || {}) } as Record<string, number>;

    if (pageView) {
      const key = pathKey(path);
      topPaths[key] = (topPaths[key] || 0) + 1;
    }

    transaction.set(
      dailyRef,
      {
        date,
        updatedAt: now,
        ...(sessionSnapshot.exists ? {} : { visitors: FieldValue.increment(1) }),
        ...(pageView
          ? {
              pageViews: FieldValue.increment(1),
              topPaths,
            }
          : {}),
      },
      { merge: true },
    );
  });

  return new NextResponse(null, { status: 204 });
}

