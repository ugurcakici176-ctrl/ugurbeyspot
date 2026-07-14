"use client";

import { useEffect, useMemo, useState } from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  deleteContactMessage,
  getContactMessages,
  updateMessageStatus,
} from "@/lib/messages";
import type { ContactMessage, MessageStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MessagesAdminClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MessageStatus>("all");

  async function loadMessages() {
    const data = await getContactMessages();
    setMessages(data);

    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }

  useEffect(() => {
    void loadMessages();
  }, []);

  const visibleMessages = useMemo(
    () =>
      filter === "all"
        ? messages
        : messages.filter((item) => item.status === filter),
    [filter, messages],
  );

  const selected =
    messages.find((item) => item.id === selectedId) || null;

  async function handleStatus(status: MessageStatus) {
    if (!selected) return;
    await updateMessageStatus(selected.id, status);
    await loadMessages();
  }

  async function handleDelete() {
    if (!selected || !window.confirm("Bu mesajı silmek istiyor musunuz?")) {
      return;
    }

    await deleteContactMessage(selected.id);
    setSelectedId(null);
    await loadMessages();
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
            {visibleMessages.map((message) => (
              <button
                type="button"
                key={message.id}
                className={selected?.id === message.id ? "is-active" : ""}
                onClick={() => setSelectedId(message.id)}
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
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>

              <div className="admin-message-contact">
                <div><span>Ad Soyad</span><strong>{selected.fullName}</strong></div>
                <div><span>Telefon</span><strong>{selected.phone}</strong></div>
                <div><span>E-posta</span><strong>{selected.email || "—"}</strong></div>
                <div><span>Tarih</span><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              <div className="admin-message-body">{selected.message}</div>

              <div className="admin-message-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => void handleStatus("read")}
                >
                  Okundu Yap
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleStatus("replied")}
                >
                  <Icon name="check" size={17} />
                  Cevaplandı
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
