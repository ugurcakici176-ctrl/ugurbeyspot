"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;
const VISITOR_STORAGE_KEY = "ugurbey.analytics.visitor";

function getVisitorId(): string {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const stored = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored) as { date?: string; id?: string };

      if (
        parsed.date === today &&
        typeof parsed.id === "string" &&
        /^[a-f0-9-]{20,50}$/i.test(parsed.id)
      ) {
        return parsed.id;
      }
    }
  } catch {
    // Private browsing and strict storage policies can reject localStorage.
  }

  const id = crypto.randomUUID();

  try {
    window.localStorage.setItem(
      VISITOR_STORAGE_KEY,
      JSON.stringify({ date: today, id }),
    );
  } catch {
    // The current page view can still be counted without persistent storage.
  }

  return id;
}

export default function LiveAnalyticsTracker({
  enabled,
  pathname,
}: {
  enabled: boolean;
  pathname: string;
}) {
  const visitorId = useRef<string | null>(null);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || pathname.startsWith("/admin")) {
      return;
    }

    visitorId.current ||= getVisitorId();
    const isPageView = lastTrackedPath.current !== pathname;

    if (isPageView) {
      lastTrackedPath.current = pathname;
    }

    const send = (pageView: boolean) => {
      if (document.visibilityState === "hidden" && !pageView) {
        return;
      }

      void fetch("/api/analytics/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId: visitorId.current,
          path: pathname,
          referrer: document.referrer,
          pageView,
        }),
        keepalive: true,
      }).catch(() => {
        // Analytics must never interrupt the shopping experience.
      });
    };

    send(isPageView);
    const interval = window.setInterval(
      () => send(false),
      HEARTBEAT_INTERVAL_MS,
    );

    return () => window.clearInterval(interval);
  }, [enabled, pathname]);

  return null;
}

