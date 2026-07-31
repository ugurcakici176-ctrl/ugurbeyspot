"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";

import {
  deleteContactMessage,
  observeContactChatMessages,
  observeContactMessages,
  replyToContactMessage,
  updateMessageStatus,
} from "@/lib/messages";

import type {
  ContactChatMessage,
  ContactMessage,
  MessageStatus,
} from "@/lib/types";

import {
  formatDate,
} from "@/lib/utils";

type MessageFilter =
  | "all"
  | MessageStatus;

function normalizeText(
  value: string,
): string {
  return value
    .toLocaleLowerCase(
      "tr-TR",
    )
    .trim();
}

function getInitials(
  fullName: string,
): string {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) =>
        part
          .slice(0, 1)
          .toLocaleUpperCase(
            "tr-TR",
          ),
      )
      .join("") || "M"
  );
}

function getStatusLabel(
  status: MessageStatus,
): string {
  switch (status) {
    case "new":
      return "Yeni";
    case "read":
      return "Okundu";
    case "answered":
    case "replied":
      return "Cevaplandı";
    default:
      return status;
  }
}

function getStatusClass(
  status: MessageStatus,
): string {
  if (
    status === "answered" ||
    status === "replied"
  ) {
    return "replied";
  }

  return status;
}

function isCustomerActive(
  message: ContactMessage,
): boolean {
  if (!message.customerOnline) {
    return false;
  }

  if (
    !message.lastCustomerSeenAt
  ) {
    return true;
  }

  const seenAt =
    new Date(
      message.lastCustomerSeenAt,
    ).getTime();

  if (
    Number.isNaN(seenAt)
  ) {
    return Boolean(
      message.customerOnline,
    );
  }

  return (
    Date.now() - seenAt <
    90_000
  );
}

export default function MessagesAdminClient() {
  const [
    messages,
    setMessages,
  ] = useState<
    ContactMessage[]
  >([]);

  const [
    chatMessages,
    setChatMessages,
  ] = useState<
    ContactChatMessage[]
  >([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(
    null,
  );

  const [
    filter,
    setFilter,
  ] = useState<MessageFilter>(
    "all",
  );

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    replyText,
    setReplyText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    threadLoading,
    setThreadLoading,
  ] = useState(false);

  const [
    runningAction,
    setRunningAction,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe =
      observeContactMessages(
        (items) => {
          setMessages(items);

          setSelectedId(
            (current) => {
              if (
                current &&
                items.some(
                  (item) =>
                    item.id ===
                    current,
                )
              ) {
                return current;
              }

              return (
                items[0]?.id ??
                null
              );
            },
          );

          setLoading(false);
        },
        (
          reason: unknown,
        ) => {
          setActionError(
            reason instanceof Error
              ? reason.message
              : "Mesajlar yüklenemedi.",
          );

          setLoading(false);
        },
      );

    return () => {
      unsubscribe();
    };
  }, []);

  const selected =
    useMemo(
      () =>
        messages.find(
          (item) =>
            item.id ===
            selectedId,
        ) ?? null,
      [messages, selectedId],
    );

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setReplyText(
      selected?.adminReply ?? "",
    );

    setActionError(null);
    setActionSuccess(null);
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [
  selected?.id,
  selected?.adminReply,
]);

useEffect(() => {
  let unsubscribe: (() => void) | undefined;

  const timeoutId = window.setTimeout(() => {
    if (!selectedId) {
      setChatMessages([]);
      setThreadLoading(false);
      return;
    }

    setThreadLoading(true);

    unsubscribe =
      observeContactChatMessages(
        selectedId,
        (items) => {
          setChatMessages(items);
          setThreadLoading(false);
        },
        (reason: unknown) => {
          setActionError(
            reason instanceof Error
              ? reason.message
              : "Sohbet mesajları yüklenemedi.",
          );

          setThreadLoading(false);
        },
      );
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
    unsubscribe?.();
  };
}, [selectedId]);

  useEffect(() => {
    if (
      !selected ||
      selected.status !== "new"
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void updateMessageStatus(
          selected.id,
          "read",
        ).catch(
          (
            reason: unknown,
          ) => {
            console.error(
              "Message could not be marked as read:",
              reason,
            );
          },
        );
      }, 350);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    selected
  ]);

  const statistics =
    useMemo(() => {
      const newCount =
        messages.filter(
          (item) =>
            item.status === "new",
        ).length;

      const readCount =
        messages.filter(
          (item) =>
            item.status === "read",
        ).length;

      const answeredCount =
        messages.filter(
          (item) =>
            item.status ===
              "answered" ||
            item.status ===
              "replied",
        ).length;

      const onlineCount =
        messages.filter(
          isCustomerActive,
        ).length;

      return {
        total:
          messages.length,
        newCount,
        readCount,
        answeredCount,
        onlineCount,
      };
    }, [messages]);

  const visibleMessages =
    useMemo(() => {
      const query =
        normalizeText(
          searchText,
        );

      return messages.filter(
        (item) => {
          const filterMatches =
            filter === "all" ||
            (filter ===
            "answered"
              ? item.status ===
                  "answered" ||
                item.status ===
                  "replied"
              : item.status ===
                filter);

          if (!filterMatches) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable =
            normalizeText(
              [
                item.fullName,
                item.phone,
                item.email ?? "",
                item.subject,
                item.message,
                item.lastMessage ??
                  "",
              ].join(" "),
            );

          return searchable.includes(
            query,
          );
        },
      );
    }, [
      filter,
      messages,
      searchText,
    ]);

  async function runAction(
    action: () => Promise<string>,
  ): Promise<void> {
    setRunningAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const successText =
        await action();

      setActionSuccess(
        successText,
      );
    } catch (
      reason: unknown
    ) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "İşlem tamamlanamadı.",
      );
    } finally {
      setRunningAction(false);
    }
  }

  async function handleStatus(
    status: MessageStatus,
  ): Promise<void> {
    if (!selected) {
      return;
    }

    await runAction(
      async () => {
        await updateMessageStatus(
          selected.id,
          status,
        );

        return "Mesaj durumu güncellendi.";
      },
    );
  }

  async function handleDelete():
    Promise<void> {
    if (
      !selected ||
      !window.confirm(
        "Bu mesajı ve sohbet kaydını silmek istiyor musunuz?",
      )
    ) {
      return;
    }

    await runAction(
      async () => {
        await deleteContactMessage(
          selected.id,
        );

        setSelectedId(null);
        setChatMessages([]);

        return "Mesaj silindi.";
      },
    );
  }

  async function handleReply():
    Promise<void> {
    if (!selected) {
      return;
    }

    const cleanReply =
      replyText.trim();

    if (!cleanReply) {
      setActionSuccess(null);
      setActionError(
        "Göndermek için bir yanıt yazın.",
      );

      return;
    }

    await runAction(
      async () => {
        const result =
          await replyToContactMessage(
            selected.id,
            cleanReply,
          );

        setReplyText("");

        if (
          result.customerActive
        ) {
          return "Yanıt müşterinin açık sohbetine canlı olarak gönderildi.";
        }

        if (result.emailed) {
          return "Yanıt sohbete kaydedildi ve çevrim dışı müşteriye e-posta bildirimi gönderildi.";
        }

        return "Yanıt sohbet geçmişine kaydedildi.";
      },
    );
  }

  async function copyValue(
    value: string,
    label: string,
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setActionError(null);
      setActionSuccess(
        `${label} panoya kopyalandı.`,
      );
    } catch {
      setActionError(
        `${label} kopyalanamadı.`,
      );
    }
  }

  const customerActive =
    selected
      ? isCustomerActive(
          selected,
        )
      : false;

  const latestMessage =
    chatMessages[
      chatMessages.length - 1
    ];

  return (
    <>
      <AdminPageHeading
        eyebrow="MESAJLAR"
        title="Canlı İletişim Merkezi"
        description="Müşteri taleplerini tek merkezden yönetin, canlı sohbetleri takip edin ve çevrim dışı kullanıcılara otomatik e-posta bildirimleri gönderin."
      />

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            label:
              "Toplam Görüşme",
            value:
              statistics.total,
            icon: "message-circle",
          },
          {
            label:
              "Yeni Mesaj",
            value:
              statistics.newCount,
            icon: "sparkles",
          },
          {
            label:
              "Okunan",
            value:
              statistics.readCount,
            icon: "inbox",
          },
          {
            label:
              "Cevaplanan",
            value:
              statistics.answeredCount,
            icon: "check",
          },
          {
            label:
              "Şu An Aktif",
            value:
              statistics.onlineCount,
            icon: "shield-check",
          },
        ].map((item) => (
          <article
            className="admin-panel"
            key={item.label}
            style={{
              minWidth: 0,
              padding: 18,
              display: "grid",
              gap: 13,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems:
                  "center",
                borderRadius: 13,
                background:
                  "#f4f2e9",
              }}
            >
              <Icon
                name={item.icon}
                size={20}
              />
            </span>

            <div
              style={{
                display: "grid",
                gap: 4,
              }}
            >
              <strong
                style={{
                  fontSize:
                    "1.3rem",
                }}
              >
                {item.value}
              </strong>

              <span
                style={{
                  color:
                    "var(--admin-muted)",
                  fontSize:
                    ".65rem",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-message-layout">
        <section className="admin-panel admin-message-list">
          <div
            style={{
              padding: 16,
              borderBottom:
                "1px solid var(--admin-border)",
            }}
          >
            <label
              style={{
                position:
                  "relative",
                display: "block",
              }}
            >
              <span
                style={{
                  position:
                    "absolute",
                  left: 14,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color:
                    "var(--admin-muted)",
                  pointerEvents:
                    "none",
                }}
              >
                <Icon
                  name="search"
                  size={17}
                />
              </span>

              <input
                value={searchText}
                onChange={(
                  event,
                ) =>
                  setSearchText(
                    event.target
                      .value,
                  )
                }
                placeholder="Müşteri, telefon, konu veya mesaj ara..."
                style={{
                  width: "100%",
                  minHeight: 46,
                  padding:
                    "0 14px 0 42px",
                  border:
                    "1px solid var(--admin-border)",
                  borderRadius: 13,
                  outline: 0,
                  background:
                    "#fff",
                }}
              />
            </label>
          </div>

          <div className="admin-message-filters">
            {[
              [
                "all",
                "Tümü",
              ],
              [
                "new",
                "Yeni",
              ],
              [
                "read",
                "Okundu",
              ],
              [
                "answered",
                "Cevaplandı",
              ],
            ].map(
              ([
                value,
                label,
              ]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filter === value
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      value as MessageFilter,
                    )
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="admin-message-list__items">
            {loading && (
              <div className="admin-empty">
                Mesajlar yükleniyor...
              </div>
            )}

            {!loading &&
              visibleMessages.length ===
                0 && (
                <div className="admin-empty">
                  Bu arama veya
                  filtrede mesaj
                  bulunamadı.
                </div>
              )}

            {visibleMessages.map(
              (message) => {
                const online =
                  isCustomerActive(
                    message,
                  );

                return (
                  <button
                    type="button"
                    key={message.id}
                    className={
                      selected?.id ===
                      message.id
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedId(
                        message.id,
                      )
                    }
                    disabled={
                      runningAction
                    }
                  >
                    <div>
                      <span
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 9,
                          minWidth:
                            0,
                        }}
                      >
                        <span
                          style={{
                            position:
                              "relative",
                            width: 35,
                            height: 35,
                            flex:
                              "0 0 auto",
                            display:
                              "grid",
                            placeItems:
                              "center",
                            borderRadius:
                              12,
                            background:
                              "#f1efe7",
                            fontSize:
                              ".62rem",
                            fontWeight:
                              850,
                          }}
                        >
                          {getInitials(
                            message.fullName,
                          )}

                          {online && (
                            <span
                              style={{
                                position:
                                  "absolute",
                                right:
                                  -1,
                                bottom:
                                  -1,
                                width: 10,
                                height: 10,
                                border:
                                  "2px solid #fff",
                                borderRadius:
                                  "50%",
                                background:
                                  "#28a56b",
                              }}
                            />
                          )}
                        </span>

                        <strong
                          style={{
                            overflow:
                              "hidden",
                            textOverflow:
                              "ellipsis",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            message.fullName
                          }
                        </strong>
                      </span>

                      <span
                        className={`admin-status admin-status--${getStatusClass(
                          message.status,
                        )}`}
                      >
                        {getStatusLabel(
                          message.status,
                        )}
                      </span>
                    </div>

                    <p>
                      {message.lastMessage ||
                        message.message ||
                        message.subject}
                    </p>

                    <small>
                      {online
                        ? "Çevrim içi • "
                        : ""}
                      {formatDate(
                        message.lastMessageAt ||
                          message.createdAt,
                      )}
                    </small>
                  </button>
                );
              },
            )}
          </div>
        </section>

        <section className="admin-panel admin-message-detail">
          {selected ? (
            <>
              <div className="admin-message-detail__heading">
                <div>
                  <span>
                    GÖRÜŞME DETAYI
                  </span>

                  <h2>
                    {
                      selected.subject
                    }
                  </h2>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 8,
                      marginTop: 9,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius:
                          "50%",
                        background:
                          customerActive
                            ? "#28a56b"
                            : "#b6b3aa",
                      }}
                    />

                    <small
                      style={{
                        color:
                          customerActive
                            ? "#176e46"
                            : "var(--admin-muted)",
                        fontWeight:
                          750,
                      }}
                    >
                      {customerActive
                        ? "Müşteri şu anda sitede aktif"
                        : selected.lastCustomerSeenAt
                          ? `Son görülme: ${formatDate(
                              selected.lastCustomerSeenAt,
                            )}`
                          : "Müşteri çevrim dışı"}
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-icon-danger"
                  onClick={() =>
                    void handleDelete()
                  }
                  disabled={
                    runningAction
                  }
                  aria-label="Mesajı sil"
                >
                  <Icon
                    name="trash"
                    size={18}
                  />
                </button>
              </div>

              {actionError && (
                <div className="admin-form-error">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="admin-form-success">
                  {actionSuccess}
                </div>
              )}

              <div className="admin-message-contact">
                <div>
                  <span>
                    Ad Soyad
                  </span>
                  <strong>
                    {
                      selected.fullName
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Telefon
                  </span>
                  <strong>
                    {selected.phone}
                  </strong>
                </div>

                <div>
                  <span>
                    E-posta
                  </span>
                  <strong>
                    {selected.email ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Başlangıç
                  </span>
                  <strong>
                    {formatDate(
                      selected.createdAt,
                    )}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                  marginTop: 12,
                }}
              >
                <a
                  href={`tel:${selected.phone}`}
                  className="admin-secondary-button"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <Icon
                    name="phone"
                    size={17}
                  />
                  Ara
                </a>

                <a
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-secondary-button"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <Icon
                    name="message-circle"
                    size={17}
                  />
                  WhatsApp
                </a>

                {selected.email && (
                  <a
                    href={`mailto:${selected.email}`}
                    className="admin-secondary-button"
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >
                    <Icon
                      name="mail"
                      size={17}
                    />
                    E-posta
                  </a>
                )}

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    void copyValue(
                      selected.phone,
                      "Telefon",
                    )
                  }
                >
                  Telefonu Kopyala
                </button>
              </div>

            

              <section
                style={{
                  marginTop: 20,
                  padding: 18,
                  border:
                    "1px solid var(--admin-border)",
                  borderRadius: 17,
                  background:
                    "#faf9f5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                    marginBottom: 15,
                  }}
                >
                  <div>
                    <span
                      style={{
                        color:
                          "var(--admin-muted)",
                        fontSize:
                          ".59rem",
                        fontWeight:
                          800,
                        letterSpacing:
                          ".14em",
                      }}
                    >
                      CANLI SOHBET
                    </span>

                    <h3
                      style={{
                        margin:
                          "5px 0 0",
                      }}
                    >
                      Konuşma Akışı
                    </h3>
                  </div>

                  <span
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius:
                        999,
                      color:
                        customerActive
                          ? "#176e46"
                          : "var(--admin-muted)",
                      fontSize:
                        ".62rem",
                      fontWeight:
                        800,
                      background:
                        customerActive
                          ? "#eaf7f0"
                          : "#eceae3",
                    }}
                  >
                    {customerActive
                      ? "CANLI"
                      : "ÇEVRİM DIŞI"}
                  </span>
                </div>

                {threadLoading && (
                  <div className="admin-empty">
                    Sohbet yükleniyor...
                  </div>
                )}

                {!threadLoading &&
                  chatMessages.length ===
                    0 && (
                    <div className="admin-empty">
                      Henüz ek sohbet
                      mesajı bulunmuyor.
                    </div>
                  )}

                {chatMessages.length >
                  0 && (
                  <div className="admin-message-thread">
                    {chatMessages.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className={`admin-message-thread__item admin-message-thread__item--${item.sender}`}
                        >
                          <small>
                            {item.sender ===
                            "admin"
                              ? "Admin"
                              : "Müşteri"}{" "}
                            •{" "}
                            {formatDate(
                              item.createdAt,
                              {
                                day: "2-digit",
                                month:
                                  "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              },
                            )}
                          </small>

                          <p>
                            {
                              item.text
                            }
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {latestMessage && (
                  <small
                    style={{
                      display:
                        "block",
                      marginTop: 12,
                      color:
                        "var(--admin-muted)",
                    }}
                  >
                    Son mesaj:{" "}
                    {latestMessage.sender ===
                    "admin"
                      ? "Admin"
                      : "Müşteri"}
                  </small>
                )}
              </section>

              <label className="admin-message-reply">
                <span>
                  Admin Yanıtı
                </span>

                <textarea
                  rows={5}
                  value={replyText}
                  onChange={(
                    event,
                  ) =>
                    setReplyText(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    customerActive
                      ? "Yanıtınız müşterinin açık sohbetine anında iletilecek..."
                      : "Yanıt sohbet geçmişine kaydedilecek ve uygunsa e-posta bildirimi gönderilecek..."
                  }
                  disabled={
                    runningAction
                  }
                />
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <small
                  style={{
                    color:
                      "var(--admin-muted)",
                  }}
                >
                  {replyText.length} karakter
                </small>

                <small
                  style={{
                    color:
                      customerActive
                        ? "#176e46"
                        : "var(--admin-muted)",
                    fontWeight: 750,
                  }}
                >
                  {customerActive
                    ? "Canlı teslimat"
                    : "Çevrim dışı teslimat"}
                </small>
              </div>

              {selected.adminReply && (
                <small className="admin-message-reply-meta">
                  Son kayıtlı yanıt:{" "}
                  {selected.repliedAt
                    ? formatDate(
                        selected.repliedAt,
                      )
                    : "Kayıtlı"}
                </small>
              )}

              <div className="admin-message-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    void handleStatus(
                      "read",
                    )
                  }
                  disabled={
                    runningAction
                  }
                >
                  Okundu Yap
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setReplyText("")
                  }
                  disabled={
                    runningAction ||
                    !replyText
                  }
                >
                  Temizle
                </button>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    void handleReply()
                  }
                  disabled={
                    runningAction ||
                    !replyText.trim()
                  }
                >
                  <Icon
                    name="check"
                    size={17}
                  />

                  {runningAction
                    ? "Gönderiliyor..."
                    : customerActive
                      ? "Canlı Yanıt Gönder"
                      : "Yanıtla ve Bildir"}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">
              Görüntülemek için bir
              mesaj seçin.
            </div>
          )}
        </section>
      </div>
    </>
  );
}