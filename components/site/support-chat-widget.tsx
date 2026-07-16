"use client";

import { usePathname } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import { usePublicSession } from "@/hooks/use-public-session";
import {
  findLatestCustomerChat,
  observeContactChatMessages,
  sendCustomerChatMessage,
  setCustomerChatPresence,
  submitContactMessage,
} from "@/lib/messages";
import type {
  ContactChatMessage,
  SiteSettings,
} from "@/lib/types";
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
const PRESENCE_HEARTBEAT_MS = 30_000;

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

export default function SupportChatWidget({ settings }: SupportChatWidgetProps) {
  const { session, authenticated } = usePublicSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ChatForm>(INITIAL_FORM);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ContactChatMessage[]>([]);

  const whatsappUrl = settings.contact.whatsapp
    ? buildWhatsappUrl(settings.contact.whatsapp, "Merhaba, bilgi almak istiyorum.")
    : null;

  const profileName = normalizeProfileName(session?.user.displayName || session?.user.email);
  const profilePhone = normalizeProfilePhone(session?.user.phoneNumber);
  const directMode = authenticated;

  useEffect(() => {
    if (!directMode || !session?.user.uid) {
      const timeoutId = window.setTimeout(() => {
        setChatId(null);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    let active = true;

    void findLatestCustomerChat(session.user.uid)
      .then((chat) => {
        if (!active) {
          return;
        }

        setChatId(chat?.id || null);
      })
      .catch(() => {
        if (active) {
          setChatId(null);
        }
      });

    return () => {
      active = false;
    };
  }, [directMode, session?.user.uid]);

  useEffect(() => {
    if (!chatId) {
      const timeoutId = window.setTimeout(() => {
        setChatMessages([]);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const unsubscribe = observeContactChatMessages(
      chatId,
      (items) => {
        setChatMessages(items);
      },
      () => {
        setChatMessages([]);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (!open || !directMode || !chatId) {
      return;
    }

    const setOnline = () => {
      void setCustomerChatPresence(chatId, true);
    };

    const setOffline = () => {
      void setCustomerChatPresence(chatId, false);
    };

    setOnline();

    const intervalId = window.setInterval(setOnline, PRESENCE_HEARTBEAT_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener("beforeunload", setOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, [chatId, directMode, open]);

  function handleToggle(): void {
    setOpen((current) => {
      const next = !current;

      if (!next && directMode && chatId) {
        void setCustomerChatPresence(chatId, false);
      }

      return next;
    });

    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      if (directMode && session?.user.uid && session.user.email) {
        const result = await sendCustomerChatMessage({
          chatId: chatId || undefined,
          customerUid: session.user.uid,
          customerName: profileName,
          customerEmail: session.user.email,
          customerPhone: profilePhone,
          message: form.message,
          sourcePage: pathname || "/",
          adminNotificationEmail: settings.contact.email,
        });

        setChatId(result.chatId);
      } else {
        await submitContactMessage({
          fullName: form.fullName,
          phone: form.phone,
          email: undefined,
          subject: "Web chat paneli",
          message: form.message,
          sourcePage: pathname || "/",
        });
      }

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
                <Icon name="sparkles" size={14} />
              </span>
              <small>CANLI SOHBET</small>
              <h2>Aninda Sohbet</h2>
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
            <p>{directMode ? "Kayitli profilinle direkt konusma baslat. Mesajlar anlik olarak sohbete duser." : "Mesajiniz yonetim paneline aninda duser."}</p>

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

            {directMode && chatMessages.length > 0 && (
              <div className="support-chat-thread">
                {chatMessages.map((item) => (
                  <div
                    key={item.id}
                    className={`support-chat-thread__item support-chat-thread__item--${item.sender}`}
                  >
                    <small>{item.sender === "admin" ? "Admin" : "Siz"}</small>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
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
                  Mesajiniz sohbete gonderildi.
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
        aria-label="Destek sohbetini ac"
      >
        <span className="support-chat-trigger__icon">
          <Icon name="message-circle" size={20} />
        </span>
      </button>
    </div>
  );
}
