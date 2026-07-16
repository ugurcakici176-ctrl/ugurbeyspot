"use client";

import { usePathname } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import { usePublicSession } from "@/hooks/use-public-session";
import { submitContactMessage } from "@/lib/messages";
import type { SiteSettings, WorkingHour } from "@/lib/types";
import { buildWhatsappUrl } from "@/lib/utils";

interface SupportChatWidgetProps {
  settings: SiteSettings;
}

interface ChatForm {
  fullName: string;
  phone: string;
  message: string;
}

const INITIAL_FORM: ChatForm = {
  fullName: "",
  phone: "",
  message: "",
};

const FALLBACK_PROFILE_NAME = "Kayitli kullanici";
const FALLBACK_PROFILE_PHONE = "Hesaptan iletildi";

function normalizeProfileName(value?: string | null): string {
  const normalized = (value || "").trim();

  if (!normalized) {
    return FALLBACK_PROFILE_NAME;
  }

  return normalized.slice(0, 100);
}

function normalizeProfilePhone(value?: string | null): string {
  const normalized = (value || "").trim();

  if (!normalized || normalized.length < 7 || normalized.length > 30) {
    return FALLBACK_PROFILE_PHONE;
  }

  return normalized;
}

function normalizeDayLabel(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function parseTimeToMinutes(value?: string): number | null {
  if (!value) {
    return null;
  }

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function getCurrentDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(date);
}

function resolveTodaySchedule(workingHours: WorkingHour[], now: Date): WorkingHour | null {
  if (workingHours.length === 0) {
    return null;
  }

  const dayLabel = normalizeDayLabel(getCurrentDayLabel(now));
  const byLabel = workingHours.find((item) => normalizeDayLabel(item.dayLabel) === dayLabel);

  if (byLabel) {
    return byLabel;
  }

  const jsDay = now.getDay();
  const mondayFirstIndex = jsDay === 0 ? 7 : jsDay;
  const bySortOrder = workingHours.find((item) => item.sortOrder === mondayFirstIndex);

  return bySortOrder || null;
}

function isBusinessHours(workingHours: WorkingHour[], now: Date): boolean {
  if (workingHours.length === 0) {
    return true;
  }

  const schedule = resolveTodaySchedule(workingHours, now);

  if (!schedule || schedule.isClosed) {
    return false;
  }

  const openingMinutes = parseTimeToMinutes(schedule.openingTime);
  const closingMinutes = parseTimeToMinutes(schedule.closingTime);

  if (openingMinutes === null || closingMinutes === null) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
}

export default function SupportChatWidget({ settings }: SupportChatWidgetProps) {
  const { session, authenticated } = usePublicSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ChatForm>(INITIAL_FORM);

  const whatsappUrl = useMemo(() => {
    if (!settings.contact.whatsapp) {
      return null;
    }

    return buildWhatsappUrl(settings.contact.whatsapp, "Merhaba, bilgi almak istiyorum.");
  }, [settings.contact.whatsapp]);

  useEffect(() => {
    const initTimeoutId = window.setTimeout(() => {
      setTimeTick(Date.now());
    }, 0);

    const intervalId = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60_000);

    return () => {
      window.clearTimeout(initTimeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const workingHours = settings.contact.workingHours;
  const availableInOfficeHours = useMemo(
    () => isBusinessHours(workingHours, new Date(timeTick)),
    [workingHours, timeTick],
  );
  const profileName = normalizeProfileName(session?.user.displayName || session?.user.email);
  const profilePhone = normalizeProfilePhone(session?.user.phoneNumber);
  const directMode = authenticated;

  function handleToggle(): void {
    setOpen((current) => !current);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      await submitContactMessage({
        fullName: directMode ? profileName : form.fullName,
        phone: directMode ? profilePhone : form.phone,
        email: session?.user.email || undefined,
        subject: directMode ? "Direkt kullanici konusmasi" : "Web chat paneli",
        message: form.message,
        sourcePage: pathname || "/",
      });

      setForm(INITIAL_FORM);
      setSuccess(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="support-chat-widget" aria-live="polite">
      {open && (
        <section
          id="support-chat-panel"
          className="support-chat-panel"
          role="dialog"
          aria-label="Destek paneli"
        >
          <header className="support-chat-panel__header">
            <div className="support-chat-panel__title-wrap">
              <span className="support-chat-panel__badge">
                <Icon name={availableInOfficeHours ? "sparkles" : "clock"} size={14} />
              </span>
              <small>{availableInOfficeHours ? "CANLI DESTEK" : "MESAI DISI"}</small>
              <h2>{availableInOfficeHours ? "Aninda Sohbet" : "Hizli Ulasim"}</h2>
            </div>

            <button
              type="button"
              className="support-chat-panel__close"
              onClick={() => setOpen(false)}
              aria-label="Paneli kapat"
            >
              <Icon name="x" size={18} />
            </button>
          </header>

          <form className="support-chat-form" onSubmit={handleSubmit}>
            <p>{directMode ? "Kayitli profilinle direkt konusma baslat. Mesajin aninda panele duser." : "Mesajiniz yonetim paneline aninda duser. Mesai saatlerinde en kisa surede donus yapilir."}</p>

            {!availableInOfficeHours && (
              <div className="support-chat-offline-note" role="note">
                Su an mesai disindayiz. Mesajinizi birakabilirsiniz; ilk mesai saatinde donus yapacagiz.
              </div>
            )}

            {directMode ? (
              <div className="support-chat-profile-pill" role="status">
                <span>
                  <Icon name="sparkles" size={14} />
                </span>
                <strong>{profileName}</strong>
                <small>Direkt mod aktif</small>
              </div>
            ) : (
              <>
                <label>
                  <span>Ad Soyad</span>
                  <input
                    required
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Adiniz soyadiniz"
                  />
                </label>

                <label>
                  <span>Telefon</span>
                  <input
                    required
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="05xx xxx xx xx"
                  />
                </label>
              </>
            )}

              <label>
                <span>Mesaj</span>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Kisa bir not birakin"
                />
              </label>

              {error && <div className="support-chat-alert support-chat-alert--error">{error}</div>}
              {success && (
                <div className="support-chat-alert support-chat-alert--success">
                  Mesajiniz alindi. En kisa surede donus yapacagiz.
                </div>
              )}

            <div className="support-chat-actions">
              <button type="submit" className="button button--dark button--compact" disabled={sending}>
                {sending ? "Gonderiliyor..." : directMode ? "Sohbeti Baslat" : "Mesaj Gonder"}
                <Icon name="arrow-right" size={17} />
              </button>

              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="button button--accent button--compact">
                  WhatsApp ile Yaz
                  <Icon name="external-link" size={16} />
                </a>
              )}
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`support-chat-trigger ${open ? "is-open" : ""}`}
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="support-chat-panel"
      >
        <span className="support-chat-trigger__icon">
          <Icon name={availableInOfficeHours ? "mail" : "message-circle"} size={20} />
        </span>
        <strong>{directMode ? "Direkt Konus" : "Mesaj Birak"}</strong>
        <em className="support-chat-trigger__dot" aria-hidden="true" />
      </button>
    </div>
  );
}
