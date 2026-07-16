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
  deleteProductReview,
  getProductReviews,
  updateProductReviewStatus,
} from "@/lib/product-reviews";
import type {
  ProductReview,
  ProductReviewStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ReviewsAdminClient() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ProductReviewStatus>("all");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const loadReviews = useCallback(async () => {
    const data = await getProductReviews(filter);
    setReviews(data);
    setSelectedId((current) => current ?? data[0]?.id ?? null);
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

    await updateProductReviewStatus(selected.id, status, adminNote);
    await loadReviews();
  }

  async function handleDelete(): Promise<void> {
    if (!selected || !window.confirm("Bu yorumu silmek istiyor musunuz?")) {
      return;
    }

    await deleteProductReview(selected.id);
    setSelectedId(null);
    await loadReviews();
  }

  return (
    <>
      <AdminPageHeading
        eyebrow="URUN YORUMLARI"
        title="Yorum Moderasyonu"
        description="Urun yorumlarini onaylayin, reddedin veya duzenleyerek yayin durumunu yonetin."
      />

      <div className="admin-message-layout">
        <section className="admin-panel admin-message-list">
          <div className="admin-message-filters">
            {[
              ["all", "Tumu"],
              ["pending", "Onay Bekleyen"],
              ["approved", "Onayli"],
              ["rejected", "Reddedilen"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "is-active" : ""}
                onClick={() => setFilter(value as "all" | ProductReviewStatus)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-message-list__items">
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
                    {review.status}
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
                <button
                  type="button"
                  className="admin-icon-danger"
                  onClick={() => void handleDelete()}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>

              <div className="admin-message-contact">
                <div><span>Musteri</span><strong>{selected.fullName}</strong></div>
                <div><span>Puan</span><strong>{"★".repeat(selected.rating)}</strong></div>
                <div><span>Durum</span><strong>{selected.status}</strong></div>
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
                  onClick={() => void handleStatus("pending")}
                >
                  Beklemeye Al
                </button>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => void handleStatus("rejected")}
                >
                  Reddet
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleStatus("approved")}
                >
                  <Icon name="check" size={17} />
                  Onayla ve Yayinla
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Goruntulemek icin bir yorum secin.</div>
          )}
        </section>
      </div>
    </>
  );
}
