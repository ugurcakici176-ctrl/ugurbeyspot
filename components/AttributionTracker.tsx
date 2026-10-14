"use client";

import { useEffect } from "react";

import { captureAttribution } from "@/lib/attribution";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
} from "@/lib/cookie-consent";

/**
 * Reklam kaynağını (gclid/UTM) yalnızca pazarlama çerezine izin verildiyse kaydeder.
 * İzin sonradan verilirse, kullanıcı hâlâ açılış sayfasındaysa parametreler yakalanır.
 */
export default function AttributionTracker() {
  useEffect(() => {
    function captureIfAllowed(): void {
      if (readCookieConsent()?.marketing === true) {
        captureAttribution();
      }
    }

    captureIfAllowed();
    window.addEventListener(COOKIE_CONSENT_EVENT, captureIfAllowed);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, captureIfAllowed);
    };
  }, []);

  return null;
}
