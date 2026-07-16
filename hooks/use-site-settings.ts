"use client";

import { useEffect, useState } from "react";

import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import { getGlobalSiteSettings } from "@/lib/global-site-settings";
import { getSiteSettings } from "@/lib/site-content";
import type { SiteSettings } from "@/lib/types";
import { deepClone } from "@/lib/utils";

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() =>
    deepClone(DEFAULT_SITE_SETTINGS),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([getSiteSettings(), getGlobalSiteSettings()])
      .then(([siteData, globalData]) => {
        if (!active) return;

        const merged = deepClone(siteData);
        const business = globalData.business;

        if (business.phone.trim()) {
          merged.contact.phone = business.phone.trim();
        }

        if (business.email.trim()) {
          merged.contact.email = business.email.trim();
        }

        if (business.whatsapp.trim()) {
          merged.contact.whatsapp = business.whatsapp.trim();
        }

        if (business.address.trim()) {
          merged.contact.address = business.address.trim();
        }

        if (business.mapsUrl.trim()) {
          merged.contact.googleMapsUrl = business.mapsUrl.trim();
        }

        setSettings(merged);
        setError(null);
      })
      .catch((reason: unknown) => {
        console.error("Site settings could not be loaded:", reason);
        if (active) setError("Site ayarları şu anda yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { settings, loading, error };
}
