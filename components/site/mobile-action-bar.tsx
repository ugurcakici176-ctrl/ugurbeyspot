"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import type { SiteSettings } from "@/lib/types";
import { buildTelUrl, buildWhatsappUrl } from "@/lib/utils";

export default function MobileActionBar({
  settings,
}: {
  settings: SiteSettings;
}) {
  const [open, setOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const whatsappUrl = buildWhatsappUrl(settings.contact.whatsapp);

  const actions = [
    settings.contact.phone
      ? { label: "Ara", icon: "phone", href: buildTelUrl(settings.contact.phone) }
      : null,
    whatsappUrl
      ? {
          label: "WhatsApp",
          icon: "message-circle",
          href: whatsappUrl,
        }
      : null,
  ].filter(
    (item): item is { label: string; icon: string; href: string } => Boolean(item),
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        bubbleRef.current &&
        !bubbleRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (actions.length === 0) return null;

  return (
    <div
      ref={bubbleRef}
      className={`contact-action-bubble ${open ? "is-open" : ""}`}
    >
      {open && (
        <div
          id="contact-action-menu"
          className="contact-action-bubble__menu"
          role="menu"
          aria-label="İletişim seçenekleri"
        >
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.href.startsWith("http") ? "_blank" : undefined}
              rel={action.href.startsWith("http") ? "noreferrer" : undefined}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span>
                <Icon name={action.icon} size={20} />
              </span>
              <strong>{action.label}</strong>
            </a>
          ))}
        </div>
      )}

      <button
        type="button"
        className="contact-action-bubble__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="contact-action-menu"
        aria-label={open ? "İletişim seçeneklerini kapat" : "Telefon ve WhatsApp seçeneklerini aç"}
      >
        <Icon name={open ? "x" : "phone"} size={24} />
      </button>
    </div>
  );
}
