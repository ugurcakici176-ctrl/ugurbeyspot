"use client";

import type { ReactNode } from "react";

import MobileActionBar from "@/components/site/mobile-action-bar";
import SupportChatWidget from "@/components/site/support-chat-widget";
import SiteFooter from "@/components/site/site-footer";
import SiteHeader from "@/components/site/site-header";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const { settings } = useSiteSettings();

  return (
    <div className="site-shell">
      <SiteHeader settings={settings} />
      <main className="site-main">{children}</main>
      <SiteFooter settings={settings} />
      <SupportChatWidget settings={settings} />
      <MobileActionBar settings={settings} />
    </div>
  );
}
