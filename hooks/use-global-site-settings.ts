"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_GLOBAL_SITE_SETTINGS,
  GLOBAL_SITE_SETTINGS_EVENT,
  getGlobalSiteSettings,
  type GlobalSiteSettings,
} from "@/lib/global-site-settings";

export function useGlobalSiteSettings() {
  const [
    settings,
    setSettings,
  ] = useState<GlobalSiteSettings>(
    DEFAULT_GLOBAL_SITE_SETTINGS,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let active = true;

    void getGlobalSiteSettings()
      .then((data) => {
        if (!active) {
          return;
        }

        setSettings(data);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    function handleSettingsChange(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<GlobalSiteSettings>;

      if (
        customEvent.detail
      ) {
        setSettings(
          customEvent.detail,
        );
      }
    }

    window.addEventListener(
      GLOBAL_SITE_SETTINGS_EVENT,
      handleSettingsChange,
    );

    return () => {
      active = false;

      window.removeEventListener(
        GLOBAL_SITE_SETTINGS_EVENT,
        handleSettingsChange,
      );
    };
  }, []);

  return {
    settings,
    setSettings,
    loading,
  };
}
