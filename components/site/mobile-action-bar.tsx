"use client";

import Icon from "@/components/ui/icon";
import type { SiteSettings } from "@/lib/types";
import { buildTelUrl, buildWhatsappUrl } from "@/lib/utils";

export default function MobileActionBar({
  settings,
}: {
  settings: SiteSettings;
}) {
  const actions = [
    settings.contact.phone
      ? { label: "Ara", icon: "phone", href: buildTelUrl(settings.contact.phone) }
      : null,
    settings.contact.whatsapp
      ? {
          label: "WhatsApp",
          icon: "message-circle",
          href: buildWhatsappUrl(settings.contact.whatsapp),
        }
      : null,
    settings.contact.googleMapsUrl
      ? { label: "Yol Tarifi", icon: "map-pin", href: settings.contact.googleMapsUrl }
      : null,
  ].filter(
    (item): item is { label: string; icon: string; href: string } => Boolean(item),
  );

  if (actions.length === 0) return null;

  return (
    <div className="mobile-action-bar">
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          target={action.href.startsWith("http") ? "_blank" : undefined}
          rel={action.href.startsWith("http") ? "noreferrer" : undefined}
        >
          <Icon name={action.icon} size={19} />
          <span>{action.label}</span>
        </a>
      ))}
    </div>
  );
}
