"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import { trackLeadConversion } from "@/lib/analytics";
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
  {
    value: "0-5000",
    label: "0 - 5.000 TL",
  },
  {
    value: "5000-15000",
    label: "5.000 - 15.000 TL",
  },
  {
    value: "15000-50000",
    label: "15.000 - 50.000 TL",
  },
  {
    value: "50000+",
    label: "50.000 TL+",
  },
  {
    value: "belirsiz",
    label: "Bütçeyi birlikte netleştirelim",
  },
] as const;

const URGENCY_OPTIONS = [
  {
    value: "acil",
    label: "Acil (24-48 saat)",
  },
  {
    value: "1-7-gun",
    label: "1-7 gün",
  },
  {
    value: "1-4-hafta",
    label: "1-4 hafta",
  },
  {
    value: "esnek",
    label: "Esnek",
  },
] as const;

export default function QuickQuoteModal({
  open,
  onClose,
  settings,
  sourcePage,
}: QuickQuoteModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState("");

  const [budgetRange, setBudgetRange] =
    useState<string>(
      BUDGET_OPTIONS[4].value,
    );

  const [urgency, setUrgency] =
    useState<string>(
      URGENCY_OPTIONS[3].value,
    );

  const [additionalNotes, setAdditionalNotes] =
    useState("");

  const [
    selectedProductIds,
    setSelectedProductIds,
  ] = useState<string[]>([]);

useEffect(() => {
  if (!open) {
    return;
  }

  let active = true;

  const loadProducts = async (): Promise<void> => {
    try {
      const items = await getProducts({
        includePassive: false,
        limitCount: 80,
      });

      if (!active) {
        return;
      }

      setProducts(items);
    } catch (reason: unknown) {
      console.error(
        "Hızlı teklif ürünleri yüklenemedi:",
        reason,
      );
    } finally {
      if (active) {
        setLoadingProducts(false);
      }
    }
  };

  const timeoutId = window.setTimeout(() => {
    if (!active) {
      return;
    }

    setLoadingProducts(true);
    void loadProducts();
  }, 0);

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
  };
}, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);
function handleClose(): void {
  if (submitting) {
    return;
  }

  setErrorMessage(null);
  setSuccessMessage(null);
  onClose();
}

  const selectedProducts = useMemo(
    () =>
      products
        .filter((item) =>
          selectedProductIds.includes(item.id),
        )
        .map((item) => ({
          productId: item.id,
          title: item.title,
          slug: item.slug,
          price: item.price,
        })),
    [
      products,
      selectedProductIds,
    ],
  );

 

  const currentSourcePage = useMemo(() => {
    if (
      typeof window === "undefined"
    ) {
      return sourcePage;
    }

    return (
      sourcePage ||
      `${window.location.pathname}${window.location.search}`
    );
  }, [sourcePage]);

  function handleToggleProduct(
    productId: string,
  ): void {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.filter(
          (id) => id !== productId,
        );
      }

      return [
        ...current,
        productId,
      ];
    });
  }

  function resetForm(): void {
    setFullName("");
    setPhone("");
    setEmail("");
    setNeed("");

    setBudgetRange(
      BUDGET_OPTIONS[4].value,
    );

    setUrgency(
      URGENCY_OPTIONS[3].value,
    );

    setAdditionalNotes("");
    setSelectedProductIds([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const requestId =
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

          sourcePage:
            currentSourcePage,
        });

      /**
       * Dönüşüm yalnızca Firestore
       * belgeyi başarıyla oluşturduktan sonra
       * gönderilir.
       */
    trackLeadConversion({
  formName: "quick_quote",
  transactionId: requestId,
  value: 1,
  currency: "TRY",
  sourcePage: currentSourcePage,
});

      resetForm();

      setSuccessMessage(
        "Talebiniz alındı. En kısa sürede size teklif iletilecek.",
      );
    } catch (reason: unknown) {
      console.error(
        "Hızlı teklif gönderilemedi:",
        reason,
      );

      setErrorMessage(
        reason instanceof Error
          ? reason.message
          : "Talebiniz gönderilemedi. Lütfen tekrar deneyin.",
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
    <div
      className="quick-quote-modal"
      role="presentation"
    >
      <button
        type="button"
        className="quick-quote-modal__backdrop"
        aria-label="Teklif penceresini kapat"
        onClick={handleClose}
      />

      <section
        className="quick-quote-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-quote-title"
        aria-describedby="quick-quote-description"
      >
        <header className="quick-quote-modal__header">
          <div>
            <small>HIZLI TEKLİF</small>

            <h2 id="quick-quote-title">
              İhtiyacını Seç, Teklifini Al
            </h2>

            <p id="quick-quote-description">
              Aradığın ürünleri seç veya
              ihtiyacını yaz. Ekibimiz kısa
              sürede fiyat teklifini hazırlasın.
            </p>
          </div>

          <button
            type="button"
            className="quick-quote-modal__close"
            aria-label="Kapat"
            onClick={handleClose}
          >
            <Icon
              name="x"
              size={20}
            />
          </button>
        </header>

        <form
          className="quick-quote-modal__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="quick-quote-modal__grid">
            <label className="quick-quote-field">
              <span>Ad Soyad</span>

              <input
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value,
                  )
                }
                placeholder="Adınız soyadınız"
              />
            </label>

            <label className="quick-quote-field">
              <span>Telefon</span>

              <input
                required
                type="tel"
                minLength={7}
                maxLength={30}
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value,
                  )
                }
                placeholder="05xx xxx xx xx"
              />
            </label>

            <label className="quick-quote-field">
              <span>
                E-posta (opsiyonel)
              </span>

              <input
                type="email"
                maxLength={160}
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="ornek@eposta.com"
              />
            </label>

            <label className="quick-quote-field">
              <span>Bütçe aralığı</span>

              <select
                value={budgetRange}
                onChange={(event) =>
                  setBudgetRange(
                    event.target.value,
                  )
                }
              >
                {BUDGET_OPTIONS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="quick-quote-field quick-quote-field--full">
              <span>
                Neye ihtiyacınız var?
              </span>

              <textarea
                rows={3}
                maxLength={1000}
                value={need}
                onChange={(event) =>
                  setNeed(
                    event.target.value,
                  )
                }
                placeholder="Örnek: 65 inç TV ve orta segment ses sistemi"
              />
            </label>

            <label className="quick-quote-field">
              <span>
                Ne kadar acil?
              </span>

              <select
                value={urgency}
                onChange={(event) =>
                  setUrgency(
                    event.target.value,
                  )
                }
              >
                {URGENCY_OPTIONS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="quick-quote-field quick-quote-field--full">
              <span>Ek notlar</span>

              <textarea
                rows={3}
                maxLength={2500}
                value={additionalNotes}
                onChange={(event) =>
                  setAdditionalNotes(
                    event.target.value,
                  )
                }
                placeholder="Marka tercihi, teslimat notu veya diğer detaylar"
              />
            </label>
          </div>

          <div className="quick-quote-products">
            <div className="quick-quote-products__heading">
              <strong>
                Ürün seçimi (opsiyonel)
              </strong>

              <small>
                {selectedProductIds.length}
                {" "}
                ürün seçili
              </small>
            </div>

            {loadingProducts ? (
              <div className="quick-quote-products__empty">
                Ürünler yükleniyor...
              </div>
            ) : products.length === 0 ? (
              <div className="quick-quote-products__empty">
                Seçilebilir ürün bulunamadı.
              </div>
            ) : (
              <div className="quick-quote-products__grid">
                {products.map((item) => {
                  const active =
                    selectedProductIds.includes(
                      item.id,
                    );

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        active
                          ? "is-active"
                          : undefined
                      }
                      aria-pressed={active}
                      onClick={() =>
                        handleToggleProduct(
                          item.id,
                        )
                      }
                    >
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {formatCurrency(
                          item.price,
                        )}
                      </small>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {errorMessage && (
            <div
              className="quick-quote-alert quick-quote-alert--error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              className="quick-quote-alert quick-quote-alert--success"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <div className="quick-quote-modal__actions">
            <button
              type="button"
              className="button button--ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="button button--accent"
              disabled={submitting}
            >
              <Icon
                name="save"
                size={18}
              />

              {submitting
                ? "Gönderiliyor..."
                : "Teklif Talebi Gönder"}
            </button>
          </div>

          {preferredPhone && (
            <small className="quick-quote-modal__help">
              Acil durumlar için doğrudan
              iletişim: {preferredPhone}
            </small>
          )}
        </form>
      </section>
    </div>
  );
}