"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCanDeleteRecords } from "@/components/admin/admin-form-utils";
import AdminPageHeading from "@/components/admin/admin-page-heading";
import Icon from "@/components/ui/icon";
import {
  deleteProductReview,
  getProductReviews,
  updateProductReviewStatus,
} from "@/lib/product-reviews";
import type {
  ProductReview,
  ProductReviewStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<ProductReviewStatus, string> = {
  pending: "Onay Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const FILTERS: ReadonlyArray<["all" | ProductReviewStatus, string]> = [
  ["all", "Tümü"],
  ["pending", "Onay Bekleyen"],
  ["approved", "Onaylı"],
  ["rejected", "Reddedilen"],
];

function getErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export default function ReviewsAdminClient() {
  const canDelete = useCanDeleteRecords();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ProductReviewStatus>("all");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductReviews(filter);
      setReviews(data);
      // Seçili yorum yeni listede (ör. filtre değişince) yoksa ilk yoruma geç.
      setSelectedId((current) =>
        current && data.some((item) => item.id === current)
          ? current
          : (data[0]?.id ?? null),
      );
    } catch (reason: unknown) {
      console.error("Reviews load error:", reason);
      setError(getErrorMessage(reason, "Yorumlar yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReviews();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadReviews]);

  const selected = useMemo(
    () => reviews.find((item) => item.id === selectedId) || null,
    [reviews, selectedId],
  );

  const adminNote = selected
    ? (draftNotes[selected.id] ?? selected.adminNote ?? "")
    : "";

  async function handleStatus(status: ProductReviewStatus): Promise<void> {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await updateProductReviewStatus(selected.id, status, adminNote);
      setMessage(`Yorum durumu "${STATUS_LABELS[status]}" olarak güncellendi.`);
      await loadReviews();
    } catch (reason: unknown) {
      console.error("Review status error:", reason);
      setError(getErrorMessage(reason, "Yorum durumu güncellenemedi."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selected || !window.confirm("Bu yorumu silmek istiyor musunuz?")) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await deleteProductReview(selected.id);
      setSelectedId(null);
      setMessage("Yorum silindi.");
      await loadReviews();
    } catch (reason: unknown) {
      console.error("Review delete error:", reason);
      setError(getErrorMessage(reason, "Yorum silinemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="ÜRÜN YORUMLARI"
        title="Yorum Moderasyonu"
        description="Ürün yorumlarını onaylayın, reddedin veya düzenleyerek yayın durumunu yönetin."
      />

      {error && (
        <div className="admin-notice admin-notice--error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-notice admin-notice--info" role="status">
          {message}
        </div>
      )}

      <div className="admin-message-layout">
        <section className="admin-panel admin-message-list">
          <div className="admin-message-filters">
            {FILTERS.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "is-active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-message-list__items">
            {loading && reviews.length === 0 && (
              <div className="admin-empty">Yorumlar yükleniyor...</div>
            )}
            {!loading && reviews.length === 0 && (
              <div className="admin-empty">Bu filtrede yorum bulunmuyor.</div>
            )}
            {reviews.map((review) => (
              <button
                type="button"
                key={review.id}
                className={selected?.id === review.id ? "is-active" : ""}
                onClick={() => setSelectedId(review.id)}
              >
                <div>
                  <strong>{review.fullName}</strong>
                  <span className={`admin-status admin-status--${review.status}`}>
                    {STATUS_LABELS[review.status] ?? review.status}
                  </span>
                </div>
                <p>{review.productTitle}</p>
                <small>{formatDate(review.createdAt)}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-message-detail">
          {selected ? (
            <>
              <div className="admin-message-detail__heading">
                <div>
                  <span>YORUM DETAYI</span>
                  <h2>{selected.productTitle}</h2>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    className="admin-icon-danger"
                    aria-label="Yorumu sil"
                    disabled={busy}
                    onClick={() => void handleDelete()}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                )}
              </div>

              <div className="admin-message-contact">
                <div><span>Müşteri</span><strong>{selected.fullName}</strong></div>
                <div><span>Puan</span><strong>{"★".repeat(selected.rating)}</strong></div>
                <div><span>Durum</span><strong>{STATUS_LABELS[selected.status] ?? selected.status}</strong></div>
                <div><span>Tarih</span><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              <div className="admin-message-body">{selected.comment}</div>

              <label className="admin-field" style={{ marginTop: 18 }}>
                <span>Admin Notu</span>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(event) =>
                    selected &&
                    setDraftNotes((current) => ({
                      ...current,
                      [selected.id]: event.target.value,
                    }))
                  }
                  placeholder="Moderasyon notu (opsiyonel)"
                />
              </label>

              <div className="admin-message-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={busy}
                  onClick={() => void handleStatus("pending")}
                >
                  Beklemeye Al
                </button>
                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={busy}
                  onClick={() => void handleStatus("rejected")}
                >
                  Reddet
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  disabled={busy}
                  onClick={() => void handleStatus("approved")}
                >
                  <Icon name="check" size={17} />
                  Onayla ve Yayınla
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Görüntülemek için bir yorum seçin.</div>
          )}
        </section>
      </div>
    </>
  );
}
