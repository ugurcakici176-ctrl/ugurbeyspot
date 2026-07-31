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
  deleteQuickQuoteRequest,
  getQuickQuoteRequests,
  updateQuickQuoteRequestByAdmin,
} from "@/lib/quote-requests";

import type {
  QuoteRequest,
  QuoteRequestStatus,
} from "@/lib/types";

import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

type QuoteFilter =
  | "all"
  | QuoteRequestStatus;

const STATUS_OPTIONS: Array<{
  value: QuoteRequestStatus;
  label: string;
}> = [
  {
    value: "new",
    label: "Yeni",
  },
  {
    value: "reviewing",
    label: "İnceleniyor",
  },
  {
    value: "offered",
    label: "Teklif Verildi",
  },
  {
    value: "closed",
    label: "Kapatıldı",
  },
];

const STATUS_LABELS: Record<
  QuoteRequestStatus,
  string
> = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  offered: "Teklif Verildi",
  closed: "Kapatıldı",
};

const BUDGET_LABELS: Record<
  string,
  string
> = {
  "0-5000": "0 – 5.000 TL",
  "5000-15000": "5.000 – 15.000 TL",
  "15000-50000": "15.000 – 50.000 TL",
  "50000+": "50.000 TL ve üzeri",
  belirsiz: "Birlikte netleştirilecek",
};

const URGENCY_LABELS: Record<
  string,
  string
> = {
  acil: "Acil, 24–48 saat",
  "1-7-gun": "1–7 gün",
  "1-4-hafta": "1–4 hafta",
  esnek: "Esnek",
};

function normalizeText(
  value: string,
): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .trim();
}

function getSelectedProductsTotal(
  request: QuoteRequest,
): number {
  return request.selectedProducts.reduce(
    (total, product) =>
      total + product.price,
    0,
  );
}

function getInitials(
  fullName: string,
): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) =>
      part
        .slice(0, 1)
        .toLocaleUpperCase("tr-TR"),
    )
    .join("") || "MT";
}

export default function QuoteRequestsAdminClient() {
  const [
    requests,
    setRequests,
  ] = useState<QuoteRequest[]>([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(
    null,
  );

  const [
    filter,
    setFilter,
  ] = useState<QuoteFilter>(
    "all",
  );

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

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

  const [
    draftStatus,
    setDraftStatus,
  ] =
    useState<QuoteRequestStatus>(
      "new",
    );

  const [
    offeredPriceText,
    setOfferedPriceText,
  ] = useState("");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  const loadRequests =
    useCallback(
      async (
        preferredId?: string | null,
      ): Promise<void> => {
        setLoading(true);
        setActionError(null);

        try {
          const items =
            await getQuickQuoteRequests();

          setRequests(items);

          setSelectedId(
            (current) => {
              const wantedId =
                preferredId ??
                current;

              if (
                wantedId &&
                items.some(
                  (item) =>
                    item.id ===
                    wantedId,
                )
              ) {
                return wantedId;
              }

              return (
                items[0]?.id ??
                null
              );
            },
          );
        } catch (
          reason: unknown
        ) {
          setActionError(
            reason instanceof Error
              ? reason.message
              : "Teklif talepleri yüklenemedi.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadRequests();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadRequests]);

  const selected =
    useMemo(
      () =>
        requests.find(
          (item) =>
            item.id ===
            selectedId,
        ) ?? null,
      [requests, selectedId],
    );

 useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    if (!selected) {
      setDraftStatus("new");
      setOfferedPriceText("");
      setAdminNote("");
      return;
    }

    setDraftStatus(selected.status);

    setOfferedPriceText(
      typeof selected.offeredPrice === "number"
        ? String(selected.offeredPrice)
        : "",
    );

    setAdminNote(
      selected.adminNote ?? "",
    );
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [selected]);

  const statistics =
    useMemo(() => {
      const total =
        requests.length;

      const newCount =
        requests.filter(
          (item) =>
            item.status === "new",
        ).length;

      const reviewingCount =
        requests.filter(
          (item) =>
            item.status ===
            "reviewing",
        ).length;

      const offeredCount =
        requests.filter(
          (item) =>
            item.status ===
            "offered",
        ).length;

      const offeredTotal =
        requests.reduce(
          (totalValue, item) =>
            totalValue +
            (item.offeredPrice ??
              0),
          0,
        );

      return {
        total,
        newCount,
        reviewingCount,
        offeredCount,
        offeredTotal,
      };
    }, [requests]);

  const visibleRequests =
    useMemo(() => {
      const query =
        normalizeText(
          searchText,
        );

      return requests.filter(
        (item) => {
          const filterMatches =
            filter === "all" ||
            item.status ===
              filter;

          if (!filterMatches) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchableText =
            normalizeText(
              [
                item.fullName,
                item.phone,
                item.email ?? "",
                item.answers.need,
                item.answers
                  .additionalNotes ??
                  "",
                ...item.selectedProducts.map(
                  (product) =>
                    product.title,
                ),
              ].join(" "),
            );

          return searchableText.includes(
            query,
          );
        },
      );
    }, [
      filter,
      requests,
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

  async function handleSave():
    Promise<void> {
    if (!selected) {
      return;
    }

    await runAction(
      async () => {
        let offeredPrice:
          | number
          | null = null;

        const cleanPrice =
          offeredPriceText
            .trim()
            .replace(/\./g, "")
            .replace(",", ".");

        if (cleanPrice) {
          const parsedPrice =
            Number(cleanPrice);

          if (
            !Number.isFinite(
              parsedPrice,
            ) ||
            parsedPrice < 0
          ) {
            throw new Error(
              "Geçerli bir teklif fiyatı girin.",
            );
          }

          offeredPrice =
            parsedPrice;
        }

        await updateQuickQuoteRequestByAdmin(
          selected.id,
          {
            status:
              draftStatus,
            adminNote,
            offeredPrice,
          },
        );

        await loadRequests(
          selected.id,
        );

        return draftStatus ===
          "offered"
          ? "Teklif kaydedildi ve kayıt teklif verildi olarak işaretlendi."
          : "Teklif talebi güncellendi.";
      },
    );
  }

  async function handleDelete():
    Promise<void> {
    if (
      !selected ||
      !window.confirm(
        "Bu hızlı teklif talebini kalıcı olarak silmek istiyor musunuz?",
      )
    ) {
      return;
    }

    const deletingId =
      selected.id;

    await runAction(
      async () => {
        await deleteQuickQuoteRequest(
          deletingId,
        );

        setSelectedId(null);

        await loadRequests(
          null,
        );

        return "Teklif talebi silindi.";
      },
    );
  }

  async function copyText(
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

  const selectedProductsTotal =
    selected
      ? getSelectedProductsTotal(
          selected,
        )
      : 0;

  return (
    <>
      <AdminPageHeading
        eyebrow="HIZLI TEKLİFLER"
        title="Teklif Operasyon Merkezi"
        description="Müşteri taleplerini analiz edin, ürün seçimlerini inceleyin, fiyatlandırın ve teklif sürecini uçtan uca yönetin."
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
              "Toplam Talep",
            value:
              statistics.total,
            icon: "inbox",
          },
          {
            label:
              "Yeni Talepler",
            value:
              statistics.newCount,
            icon: "sparkles",
          },
          {
            label:
              "İncelenen",
            value:
              statistics.reviewingCount,
            icon: "search",
          },
          {
            label:
              "Teklif Verilen",
            value:
              statistics.offeredCount,
            icon: "check",
          },
          {
            label:
              "Toplam Teklif",
            value:
              formatCurrency(
                statistics.offeredTotal,
              ),
            icon: "badge-percent",
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
                    "1.25rem",
                  overflow:
                    "hidden",
                  textOverflow:
                    "ellipsis",
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
                placeholder="Müşteri, telefon, ürün veya ihtiyaç ara..."
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
                "reviewing",
                "İnceleniyor",
              ],
              [
                "offered",
                "Teklifli",
              ],
              [
                "closed",
                "Kapalı",
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
                      value as QuoteFilter,
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
                Teklif talepleri
                yükleniyor...
              </div>
            )}

            {!loading &&
              visibleRequests.length ===
                0 && (
                <div className="admin-empty">
                  Arama veya filtre
                  kriterlerine uygun
                  teklif bulunamadı.
                </div>
              )}

            {visibleRequests.map(
              (request) => (
                <button
                  type="button"
                  key={request.id}
                  className={
                    selected?.id ===
                    request.id
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedId(
                      request.id,
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
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          flex: "0 0 auto",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          borderRadius:
                            11,
                          background:
                            "#f1efe7",
                          fontSize:
                            ".62rem",
                          fontWeight:
                            850,
                        }}
                      >
                        {getInitials(
                          request.fullName,
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
                          request.fullName
                        }
                      </strong>
                    </span>

                    <span
                      className={`admin-status admin-status--${
                        request.status ===
                        "offered"
                          ? "replied"
                          : request.status ===
                              "closed"
                            ? "passive"
                            : request.status ===
                                "reviewing"
                              ? "pending"
                              : request.status
                      }`}
                    >
                      {
                        STATUS_LABELS[
                          request
                            .status
                        ]
                      }
                    </span>
                  </div>

                  <p>
                    {request.answers
                      .need ||
                      request
                        .selectedProducts[0]
                        ?.title ||
                      "Genel teklif talebi"}
                  </p>

                  <small>
                    {request
                      .selectedProducts
                      .length > 0
                      ? `${request.selectedProducts.length} ürün • `
                      : ""}
                    {formatDate(
                      request.createdAt,
                    )}
                  </small>
                </button>
              ),
            )}
          </div>
        </section>

        <section className="admin-panel admin-message-detail">
          {selected ? (
            <>
              <div className="admin-message-detail__heading">
                <div>
                  <span>
                    TEKLİF TALEBİ
                  </span>

                  <h2>
                    {
                      selected.fullName
                    }
                  </h2>

                  <small
                    style={{
                      display:
                        "block",
                      marginTop: 7,
                      color:
                        "var(--admin-muted)",
                    }}
                  >
                    Talep No:{" "}
                    {selected.id}
                  </small>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() =>
                      void loadRequests(
                        selected.id,
                      )
                    }
                    disabled={
                      runningAction
                    }
                    title="Yenile"
                  >
                    <Icon
                      name="search"
                      size={17}
                    />
                    Yenile
                  </button>

                  <button
                    type="button"
                    className="admin-icon-danger"
                    onClick={() =>
                      void handleDelete()
                    }
                    disabled={
                      runningAction
                    }
                    aria-label="Teklifi sil"
                  >
                    <Icon
                      name="trash"
                      size={18}
                    />
                  </button>
                </div>
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
                    Müşteri
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
                    Talep Tarihi
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
                  className="admin-secondary-button"
                  href={`tel:${selected.phone}`}
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
                  className="admin-secondary-button"
                  href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
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
                    className="admin-secondary-button"
                    href={`mailto:${selected.email}?subject=Uğurbey Spot hızlı teklif talebiniz`}
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
                    void copyText(
                      selected.phone,
                      "Telefon",
                    )
                  }
                >
                  Kopyala
                </button>
              </div>

              <section
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <article
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background:
                      "var(--admin-bg)",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      marginBottom: 5,
                      color:
                        "var(--admin-muted)",
                      fontSize:
                        ".59rem",
                    }}
                  >
                    BÜTÇE
                  </span>

                  <strong>
                    {BUDGET_LABELS[
                      selected
                        .answers
                        .budgetRange
                    ] ||
                      selected
                        .answers
                        .budgetRange ||
                      "Belirtilmedi"}
                  </strong>
                </article>

                <article
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background:
                      "var(--admin-bg)",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      marginBottom: 5,
                      color:
                        "var(--admin-muted)",
                      fontSize:
                        ".59rem",
                    }}
                  >
                    ZAMANLAMA
                  </span>

                  <strong>
                    {URGENCY_LABELS[
                      selected
                        .answers
                        .urgency
                    ] ||
                      selected
                        .answers
                        .urgency ||
                      "Belirtilmedi"}
                  </strong>
                </article>

                <article
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background:
                      "var(--admin-bg)",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      marginBottom: 5,
                      color:
                        "var(--admin-muted)",
                      fontSize:
                        ".59rem",
                    }}
                  >
                    ÜRÜN TOPLAMI
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedProductsTotal,
                    )}
                  </strong>
                </article>
              </section>

              <section
                style={{
                  marginTop: 20,
                  padding: 20,
                  border:
                    "1px solid var(--admin-border)",
                  borderRadius: 16,
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    color:
                      "var(--admin-muted)",
                    fontSize:
                      ".59rem",
                    fontWeight: 800,
                    letterSpacing:
                      ".14em",
                  }}
                >
                  MÜŞTERİ İHTİYACI
                </span>

                <p
                  style={{
                    margin:
                      "10px 0 0",
                    lineHeight: 1.7,
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {selected.answers
                    .need ||
                    "Müşteri açıklama girmedi."}
                </p>
              </section>

              {selected.answers
                .additionalNotes && (
                <section
                  style={{
                    marginTop: 12,
                    padding: 20,
                    borderRadius:
                      16,
                    background:
                      "#fffbea",
                  }}
                >
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
                    EK NOTLAR
                  </span>

                  <p
                    style={{
                      margin:
                        "10px 0 0",
                      lineHeight:
                        1.7,
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {
                      selected
                        .answers
                        .additionalNotes
                    }
                  </p>
                </section>
              )}

              <section
                style={{
                  marginTop: 20,
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
                    marginBottom: 11,
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
                      SEÇİLEN ÜRÜNLER
                    </span>

                    <h3
                      style={{
                        margin:
                          "5px 0 0",
                      }}
                    >
                      {
                        selected
                          .selectedProducts
                          .length
                      }{" "}
                      ürün
                    </h3>
                  </div>

                  <strong>
                    {formatCurrency(
                      selectedProductsTotal,
                    )}
                  </strong>
                </div>

                {selected
                  .selectedProducts
                  .length === 0 ? (
                  <div className="admin-empty">
                    Müşteri belirli
                    bir ürün
                    seçmedi.
                  </div>
                ) : (
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {selected.selectedProducts.map(
                      (
                        product,
                      ) => (
                        <article
                          key={
                            product.productId
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: 14,
                            padding:
                              15,
                            border:
                              "1px solid var(--admin-border)",
                            borderRadius:
                              14,
                          }}
                        >
                          <div
                            style={{
                              minWidth:
                                0,
                            }}
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                product.title
                              }
                            </strong>

                            <small
                              style={{
                                color:
                                  "var(--admin-muted)",
                              }}
                            >
                              {
                                product.slug
                              }
                            </small>
                          </div>

                          <strong
                            style={{
                              flex:
                                "0 0 auto",
                            }}
                          >
                            {formatCurrency(
                              product.price,
                            )}
                          </strong>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section
                style={{
                  marginTop: 22,
                  padding: 20,
                  borderRadius: 18,
                  background:
                    "var(--admin-bg)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(180px, .6fr) minmax(180px, .7fr)",
                    gap: 14,
                  }}
                >
                  <label className="admin-field">
                    <span>
                      Süreç Durumu
                    </span>

                    <select
                      value={
                        draftStatus
                      }
                      onChange={(
                        event,
                      ) =>
                        setDraftStatus(
                          event
                            .target
                            .value as QuoteRequestStatus,
                        )
                      }
                      disabled={
                        runningAction
                      }
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="admin-field">
                    <span>
                      Kesin Teklif
                      Fiyatı
                    </span>

                    <input
                      inputMode="decimal"
                      value={
                        offeredPriceText
                      }
                      onChange={(
                        event,
                      ) =>
                        setOfferedPriceText(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Örn. 27500"
                      disabled={
                        runningAction
                      }
                    />
                  </label>
                </div>

                <label
                  className="admin-field"
                  style={{
                    marginTop: 14,
                  }}
                >
                  <span>
                    Admin Notu
                  </span>

                  <textarea
                    rows={5}
                    value={adminNote}
                    onChange={(
                      event,
                    ) =>
                      setAdminNote(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Stok durumu, alternatif ürünler, teslimat bilgisi ve müşteriyle yapılan görüşme notları..."
                    disabled={
                      runningAction
                    }
                  />
                </label>

                {draftStatus ===
                  "offered" &&
                  offeredPriceText && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        marginTop:
                          14,
                        padding:
                          "14px 16px",
                        borderRadius:
                          13,
                        color:
                          "#176e46",
                        background:
                          "#eaf7f0",
                      }}
                    >
                      <span>
                        Müşteriye
                        sunulacak fiyat
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            offeredPriceText
                              .replace(
                                /\./g,
                                "",
                              )
                              .replace(
                                ",",
                                ".",
                              ),
                          ) || 0,
                        )}
                      </strong>
                    </div>
                  )}
              </section>

              <div className="admin-message-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setDraftStatus(
                      selected.status,
                    );

                    setOfferedPriceText(
                      typeof selected.offeredPrice ===
                        "number"
                        ? String(
                            selected.offeredPrice,
                          )
                        : "",
                    );

                    setAdminNote(
                      selected.adminNote ??
                        "",
                    );
                  }}
                  disabled={
                    runningAction
                  }
                >
                  Değişiklikleri Sıfırla
                </button>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    void handleSave()
                  }
                  disabled={
                    runningAction
                  }
                >
                  <Icon
                    name="save"
                    size={17}
                  />

                  {runningAction
                    ? "Kaydediliyor..."
                    : "Teklifi Kaydet"}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">
              Görüntülemek için bir
              hızlı teklif talebi
              seçin.
            </div>
          )}
        </section>
      </div>
    </>
  );
}