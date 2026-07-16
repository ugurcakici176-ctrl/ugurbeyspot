"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import { getProducts } from "@/lib/products";
import { submitQuickQuoteRequest } from "@/lib/quote-requests";
import type {
  Product,
  SiteSettings,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface QuickQuoteModalProps {

  open: boolean;

  onClose: () => void;

  settings?: SiteSettings;

  sourcePage: string;

}

const BUDGET_OPTIONS = [
  { value: "0-5000", label: "0 - 5.000 TL" },
  { value: "5000-15000", label: "5.000 - 15.000 TL" },
  { value: "15000-50000", label: "15.000 - 50.000 TL" },
  { value: "50000+", label: "50.000 TL+" },
  { value: "belirsiz", label: "Butceyi birlikte netlestirelim" },
] as const;

const URGENCY_OPTIONS = [
  { value: "acil", label: "Acil (24-48 saat)" },
  { value: "1-7-gun", label: "1-7 gun" },
  { value: "1-4-hafta", label: "1-4 hafta" },
  { value: "esnek", label: "Esnek" },
] as const;

export default function QuickQuoteModal({
  open,
  onClose,
  settings,
  sourcePage,
}: QuickQuoteModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState("");
  const [budgetRange, setBudgetRange] = useState<string>(BUDGET_OPTIONS[4].value);
  const [urgency, setUrgency] = useState<string>(URGENCY_OPTIONS[3].value);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoadingProducts(true);

      void getProducts({ includePassive: false, limitCount: 80 })
        .then((items) => {
          setProducts(items);
        })
        .catch((reason: unknown) => {
          console.error("Quick quote products could not be loaded:", reason);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const selectedProducts = useMemo(
    () =>
      products
        .filter((item) => selectedProductIds.includes(item.id))
        .map((item) => ({
          productId: item.id,
          title: item.title,
          slug: item.slug,
          price: item.price,
        })),
    [products, selectedProductIds],
  );

  function handleToggleProduct(productId: string): void {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function resetForm(): void {
    setFullName("");
    setPhone("");
    setEmail("");
    setNeed("");
    setBudgetRange(BUDGET_OPTIONS[4].value);
    setUrgency(URGENCY_OPTIONS[3].value);
    setAdditionalNotes("");
    setSelectedProductIds([]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await submitQuickQuoteRequest({
        fullName,
        phone,
        email,
        selectedProducts,
        answers: {
          need,
          budgetRange,
          urgency,
          additionalNotes,
        },
        sourcePage,
      });

      resetForm();
      setSuccessMessage("Talebiniz alindi. En kisa surede size teklif donulecek.");
    } catch (reason: unknown) {
      setErrorMessage(
        reason instanceof Error ? reason.message : "Talebiniz gonderilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

const preferredPhone =

  settings?.contact?.phone ||

  settings?.contact?.whatsapp ||

  "";

  return (
    <div className="quick-quote-modal" role="presentation">
      <button
        type="button"
        className="quick-quote-modal__backdrop"
        aria-label="Teklif modalini kapat"
        onClick={onClose}
      />

      <section
        className="quick-quote-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Hizli teklif olustur"
      >
        <header className="quick-quote-modal__header">
          <div>
            <small>HIZLI TEKLIF</small>
            <h2>Ihtiyacini Sec, Teklifini Al</h2>
            <p>
              Aradigin urunleri sec veya ihtiyacini yaz. Ekibimiz kisa surede fiyat
              teklifini hazirlasin.
            </p>
          </div>

          <button
            type="button"
            className="quick-quote-modal__close"
            aria-label="Kapat"
            onClick={onClose}
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <form className="quick-quote-modal__form" onSubmit={handleSubmit}>
          <div className="quick-quote-modal__grid">
            <label className="quick-quote-field">
              <span>Ad Soyad</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Adiniz soyadiniz"
              />
            </label>

            <label className="quick-quote-field">
              <span>Telefon</span>
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="05xx xxx xx xx"
              />
            </label>

            <label className="quick-quote-field">
              <span>E-posta (opsiyonel)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@eposta.com"
              />
            </label>

            <label className="quick-quote-field">
              <span>Butce araligi</span>
              <select
                value={budgetRange}
                onChange={(event) => setBudgetRange(event.target.value)}
              >
                {BUDGET_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="quick-quote-field quick-quote-field--full">
              <span>Neye ihtiyaciniz var?</span>
              <textarea
                rows={3}
                value={need}
                onChange={(event) => setNeed(event.target.value)}
                placeholder="Ornek: 65 inch TV + orta segment ses sistemi"
              />
            </label>

            <label className="quick-quote-field">
              <span>Ne kadar acil?</span>
              <select
                value={urgency}
                onChange={(event) => setUrgency(event.target.value)}
              >
                {URGENCY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="quick-quote-field quick-quote-field--full">
              <span>Ek notlar</span>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
                placeholder="Marka tercihi, teslimat notu veya diger detaylar"
              />
            </label>
          </div>

          <div className="quick-quote-products">
            <div className="quick-quote-products__heading">
              <strong>Urun secimi (opsiyonel)</strong>
              <small>
                {selectedProductIds.length} urun secili
              </small>
            </div>

            {loadingProducts ? (
              <div className="quick-quote-products__empty">Urunler yukleniyor...</div>
            ) : products.length === 0 ? (
              <div className="quick-quote-products__empty">Secilebilir urun bulunamadi.</div>
            ) : (
              <div className="quick-quote-products__grid">
                {products.map((item) => {
                  const active = selectedProductIds.includes(item.id);

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={active ? "is-active" : undefined}
                      onClick={() => handleToggleProduct(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <small>{formatCurrency(item.price)}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {errorMessage && <div className="quick-quote-alert quick-quote-alert--error">{errorMessage}</div>}
          {successMessage && <div className="quick-quote-alert quick-quote-alert--success">{successMessage}</div>}

          <div className="quick-quote-modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Vazgec
            </button>

            <button type="submit" className="button button--accent" disabled={submitting}>
              <Icon name="save" size={18} />
              {submitting ? "Gonderiliyor..." : "Teklif Talebi Gonder"}
            </button>
          </div>

          {preferredPhone && (
            <small className="quick-quote-modal__help">
              Acil durumlar icin dogrudan iletisim: {preferredPhone}
            </small>
          )}
        </form>
      </section>
    </div>
  );
}
