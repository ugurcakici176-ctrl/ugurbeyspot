"use client";

import { useEffect, useState } from "react";

import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
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

    void getSiteSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data);
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
