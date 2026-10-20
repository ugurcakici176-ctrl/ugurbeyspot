"use client";

import { useEffect } from "react";

import { trackPhoneClick, trackWhatsAppClick } from "@/lib/analytics";

const WHATSAPP_HOSTS = ["wa.me", "api.whatsapp.com", "web.whatsapp.com"];

/**
 * Sitedeki tüm tel: ve WhatsApp bağlantılarının tıklanmasını tek yerden ölçer
 * (header, footer, ürün, iletişim, hesabım…). Yerel işletmede asıl dönüşüm budur.
 */
export default function ContactClickTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const anchor = (event.target as Element | null)?.closest?.("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href") || "";

      if (href.startsWith("tel:")) {
        trackPhoneClick(href.slice(4));
        return;
      }

      try {
        const url = new URL(href, window.location.href);

        if (WHATSAPP_HOSTS.includes(url.hostname)) {
          trackWhatsAppClick(url.pathname.replace(/\D/g, "") || undefined);
        }
      } catch {
        // geçersiz href: ölçülmez
      }
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
