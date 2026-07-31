import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_PATTERN =
  /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|slurp|facebookexternalhit|preview/i;

const VISITOR_ID_PATTERN =
  /^[a-z0-9-]{20,80}$/i;

const HEARTBEAT_INTERVAL_MS = 10_000;

interface AnalyticsTrackInput {
  visitorId?: unknown;
  path?: unknown;
  referrer?: unknown;
  pageView?: unknown;
}

function noContent(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function istanbulDate(
  date = new Date(),
): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

function cleanPath(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/")
  ) {
    return null;
  }

  const withoutQuery =
    value.split("?")[0].split("#")[0];

  const normalized =
    withoutQuery
      .replace(/\/{2,}/g, "/")
      .slice(0, 180);

  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/api") ||
    normalized.startsWith("/_next")
  ) {
    return null;
  }

  return normalized || "/";
}

function cleanReferrer(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    return `${url.origin}${url.pathname}`
      .slice(0, 300);
  } catch {
    return null;
  }
}

function pathKey(path: string): string {
  return Buffer
    .from(path, "utf8")
    .toString("base64url");
}

function isValidVisitorId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    VISITOR_ID_PATTERN.test(value)
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const userAgent =
      request.headers.get("user-agent") ?? "";

    if (
      !userAgent ||
      BOT_PATTERN.test(userAgent)
    ) {
      return noContent();
    }

    let input: AnalyticsTrackInput;

    try {
      input =
        (await request.json()) as AnalyticsTrackInput;
    } catch {
      /*
       * Analitik isteği geçersiz olsa bile
       * kullanıcı konsoluna 4xx hatası düşürmeyelim.
       */
      return noContent();
    }

    if (!isValidVisitorId(input.visitorId)) {
      return noContent();
    }

    const path = cleanPath(input.path);

    if (!path) {
      return noContent();
    }

    const visitorId = input.visitorId;
    const pageView = input.pageView === true;
    const referrer =
      cleanReferrer(input.referrer);

    const db = getAdminDb();
    const date = istanbulDate();
    const now = Timestamp.now();

    const sessionRef = db
      .collection("analytics_sessions")
      .doc(`${date}_${visitorId}`);

    const dailyRef = db
      .collection("analytics_daily")
      .doc(date);

    await db.runTransaction(
      async (transaction) => {
        const [
          sessionSnapshot,
          dailySnapshot,
        ] = await Promise.all([
          transaction.get(sessionRef),
          transaction.get(dailyRef),
        ]);

        const previous =
          sessionSnapshot.data();

        const previousSeen =
          previous?.lastSeenAt;

        /*
         * Aynı ziyaretçiden çok sık gelen
         * heartbeat isteklerini kaydetme.
         * Gerçek pageView kayıtları bu filtreden
         * etkilenmez.
         */
        if (
          !pageView &&
          previousSeen instanceof Timestamp &&
          now.toMillis() -
            previousSeen.toMillis() <
            HEARTBEAT_INTERVAL_MS
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

            ...(referrer
              ? {
                  lastReferrer: referrer,
                }
              : {}),

            ...(sessionSnapshot.exists
              ? {}
              : {
                  firstSeenAt: now,
                  firstPath: path,

                  ...(referrer
                    ? {
                        firstReferrer:
                          referrer,
                      }
                    : {}),
                }),

            ...(pageView
              ? {
                  pageViews:
                    FieldValue.increment(1),
                }
              : {}),
          },
          {
            merge: true,
          },
        );

        const daily =
          dailySnapshot.data() ?? {};

        const rawTopPaths =
          daily.topPaths;

        const topPaths: Record<
          string,
          number
        > =
          rawTopPaths &&
          typeof rawTopPaths === "object" &&
          !Array.isArray(rawTopPaths)
            ? {
                ...(rawTopPaths as Record<
                  string,
                  number
                >),
              }
            : {};

        if (pageView) {
          const key = pathKey(path);

          const currentCount =
            typeof topPaths[key] === "number"
              ? topPaths[key]
              : 0;

          topPaths[key] =
            currentCount + 1;
        }

        transaction.set(
          dailyRef,
          {
            date,
            updatedAt: now,

            ...(sessionSnapshot.exists
              ? {}
              : {
                  visitors:
                    FieldValue.increment(1),
                }),

            ...(pageView
              ? {
                  pageViews:
                    FieldValue.increment(1),
                  topPaths,
                }
              : {}),
          },
          {
            merge: true,
          },
        );
      },
    );

    return noContent();
  } catch (reason: unknown) {
    /*
     * Analitik hiçbir zaman site deneyimini
     * veya form gönderimini bozmamalı.
     * Ayrıntı yalnızca sunucu loguna yazılır.
     */
    console.error(
      "Analytics tracking request failed:",
      reason instanceof Error
        ? {
            name: reason.name,
            message: reason.message,
            stack: reason.stack,
          }
        : reason,
    );

    return noContent();
  }
}