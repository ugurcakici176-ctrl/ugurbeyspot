"use client";

import {
  usePathname,
} from "next/navigation";
import type {
  ReactNode,
} from "react";

import IntegrationManager from "@/components/site/integration-manager";
import MaintenanceGate from "@/components/site/maintenance-gate";
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
    <MaintenanceGate
      settings={settings}
      settingsLoading={loading}
    >
      <IntegrationManager
        settings={settings}
      />

      {children}
    </MaintenanceGate>
  );
}
