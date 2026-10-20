"use client";

import {
  usePathname,
} from "next/navigation";
import type {
  ReactNode,
} from "react";

import AttributionTracker from "@/components/AttributionTracker";
import ContactClickTracker from "@/components/site/contact-click-tracker";
import IntegrationManager from "@/components/site/integration-manager";
import MaintenanceGate from "@/components/site/maintenance-gate";
import CookieConsent from "@/components/legal/cookie-consent";
import {
  useGlobalSiteSettings,
} from "@/hooks/use-global-site-settings";

export default function GlobalSiteRuntime({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const {
    settings,
    loading,
  } = useGlobalSiteSettings();

  if (
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/",
    )
  ) {
    return <>{children}</>;
  }

  return (
    <>
      <MaintenanceGate
        settings={settings}
        settingsLoading={loading}
      >
        <IntegrationManager
          settings={settings}
        />

        <AttributionTracker />
        <ContactClickTracker />

        {children}
      </MaintenanceGate>

      <CookieConsent />
    </>
  );
}
