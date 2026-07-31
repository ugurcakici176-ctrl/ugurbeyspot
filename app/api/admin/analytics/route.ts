import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import type { LiveAnalyticsSummary } from "@/lib/live-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function istanbulDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function lastDates(count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (count - index - 1));
    return istanbulDate(date);
  });
}

async function verifyAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return false;

  try {
    const token = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const admin = await getAdminDb().collection("admins").doc(token.uid).get();
    const data = admin.data();
    return (
      admin.exists &&
      data?.status === "active" &&
      ["super_admin", "admin", "editor"].includes(data.role)
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const db = getAdminDb();
  const dates = lastDates(14);
  const dailyRefs = dates.map((date) => db.collection("analytics_daily").doc(date));
  const activeSince = Timestamp.fromMillis(Date.now() - 2 * 60_000);

  const [dailySnapshots, activeSnapshot] = await Promise.all([
    db.getAll(...dailyRefs),
    db
      .collection("analytics_sessions")
      .where("lastSeenAt", ">=", activeSince)
      .limit(500)
      .get(),
  ]);

  const trend = dailySnapshots.map((snapshot, index) => ({
    date: dates[index],
    visitors: Number(snapshot.data()?.visitors || 0),
    pageViews: Number(snapshot.data()?.pageViews || 0),
  }));
  const today = dailySnapshots.at(-1)?.data() || {};
  const topPaths = Object.entries(
    (today.topPaths || {}) as Record<string, number>,
  )
    .map(([key, views]) => {
      try {
        return {
          path: Buffer.from(key, "base64url").toString("utf8"),
          views: Number(views),
        };
      } catch {
        return { path: "/", views: Number(views) };
      }
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const result: LiveAnalyticsSummary = {
    activeNow: activeSnapshot.size,
    todayVisitors: Number(today.visitors || 0),
    todayPageViews: Number(today.pageViews || 0),
    lastUpdatedAt: new Date().toISOString(),
    trend,
    topPaths,
  };

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}

