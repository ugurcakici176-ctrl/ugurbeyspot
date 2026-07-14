"use client";

import type { ReactNode } from "react";

import MobileActionBar from "@/components/site/mobile-action-bar";
import SiteFooter from "@/components/site/site-footer";
import SiteHeader from "@/components/site/site-header";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();

  return (
    <>
      <SiteHeader settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
      <MobileActionBar settings={settings} />
    </>
  );
}
