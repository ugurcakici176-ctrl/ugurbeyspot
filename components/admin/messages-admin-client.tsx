"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  deleteContactMessage,
  getContactMessages,
  replyToContactMessage,
  updateMessageStatus,
} from "@/lib/messages";
import type { ContactMessage, MessageStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MessagesAdminClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MessageStatus>("all");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const selectedMessage = messages.find((item) => item.id === selectedId);
      setReplyText(selectedMessage?.adminReply || "");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [messages, selectedId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getContactMessages();
      setMessages(data);

      setSelectedId((current) =>
        current ?? data[0]?.id ?? null,
      );
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Mesajlar yuklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMessages]);

  const visibleMessages = useMemo(
    () =>
      filter === "all"
        ? messages
        : messages.filter((item) => item.status === filter),
    [filter, messages],
  );

  const selected =
    messages.find((item) => item.id === selectedId) || null;

  async function runAction(
    action: () => Promise<string>,
  ) {
    setRunningAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const successText = await action();
      setActionSuccess(successText);
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Islem tamamlanamadi.",
      );
    } finally {
      setRunningAction(false);
    }
  }

  async function handleStatus(status: MessageStatus) {
    if (!selected) return;

    await runAction(async () => {
      await updateMessageStatus(selected.id, status);
      await loadMessages();
      return "Mesaj durumu guncellendi.";
    });
  }

  async function handleDelete() {
    if (!selected || !window.confirm("Bu mesajı silmek istiyor musunuz?")) {
      return;
    }

    await runAction(async () => {
      await deleteContactMessage(selected.id);
      setSelectedId(null);
      await loadMessages();
      return "Mesaj silindi.";
    });
  }

  async function handleReply() {
    if (!selected) {
      return;
    }

    await runAction(async () => {
      const result = await replyToContactMessage(selected.id, replyText);

      await loadMessages();

      if (result.queued) {
        return result.mailId
          ? `Yanit kuyruğa alindi (mail: ${result.mailId}).`
          : "Yanit kuyruğa alindi.";
      }

      return "Yanit kaydedildi.";
    });
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="MESAJLAR"
        title="İletişim Kutusu"
        description="Web sitesinden gelen müşteri mesajlarını okuyun ve durumlarını yönetin."
      />

      <div className="admin-message-layout">
        <section className="admin-panel admin-message-list">
          <div className="admin-message-filters">
            {[
              ["all", "Tümü"],
              ["new", "Yeni"],
              ["read", "Okundu"],
              ["replied", "Cevaplandı"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "is-active" : ""}
                onClick={() => setFilter(value as "all" | MessageStatus)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-message-list__items">
            {loading && <div className="admin-empty">Mesajlar yukleniyor...</div>}

            {!loading && visibleMessages.length === 0 && (
              <div className="admin-empty">Bu filtrede mesaj bulunmuyor.</div>
            )}

            {visibleMessages.map((message) => (
              <button
                type="button"
                key={message.id}
                className={selected?.id === message.id ? "is-active" : ""}
                onClick={() => setSelectedId(message.id)}
                disabled={runningAction}
              >
                <div>
                  <strong>{message.fullName}</strong>
                  <span className={`admin-status admin-status--${message.status}`}>
                    {message.status}
                  </span>
                </div>
                <p>{message.subject}</p>
                <small>{formatDate(message.createdAt)}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-message-detail">
          {selected ? (
            <>
              <div className="admin-message-detail__heading">
                <div>
                  <span>MESAJ DETAYI</span>
                  <h2>{selected.subject}</h2>
                </div>
                <button
                  type="button"
                  className="admin-icon-danger"
                  onClick={() => void handleDelete()}
                  disabled={runningAction}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>

              {actionError && <div className="admin-form-error">{actionError}</div>}
              {actionSuccess && <div className="admin-form-success">{actionSuccess}</div>}

              <div className="admin-message-contact">
                <div><span>Ad Soyad</span><strong>{selected.fullName}</strong></div>
                <div><span>Telefon</span><strong>{selected.phone}</strong></div>
                <div><span>E-posta</span><strong>{selected.email || "—"}</strong></div>
                <div><span>Tarih</span><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              <div className="admin-message-body">{selected.message}</div>

              <label className="admin-message-reply">
                <span>Admin Yanıtı</span>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Musteriye gidecek yanit notunu yazin..."
                  disabled={runningAction}
                />
              </label>

              {selected.adminReply && (
                <small className="admin-message-reply-meta">
                  Son yanit: {selected.repliedAt ? formatDate(selected.repliedAt) : "Kayitli"}
                </small>
              )}

              <div className="admin-message-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => void handleStatus("read")}
                  disabled={runningAction}
                >
                  Okundu Yap
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleReply()}
                  disabled={runningAction}
                >
                  <Icon name="check" size={17} />
                  {runningAction ? "Isleniyor..." : "Yanıtla ve Cevaplandı Yap"}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">
              Görüntülemek için bir mesaj seçin.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
