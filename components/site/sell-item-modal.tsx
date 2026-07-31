"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import { usePublicSession } from "@/hooks/use-public-session";
import { trackLeadConversion } from "@/lib/analytics";
import { submitSellRequest } from "@/lib/sell-requests";

const CATEGORIES = [
  "Beyaz Eşya",
  "Mobilya",
  "Televizyon & Elektronik",
  "Küçük Ev Aleti",
  "Diğer",
] as const;

const MAX_FILE_COUNT = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

interface SellItemModalProps {
  open: boolean;
  onClose: () => void;
}

function getReadableError(reason: unknown): string {
  if (!(reason instanceof Error)) {
    return "Talebiniz gönderilemedi. Lütfen tekrar deneyin.";
  }

  const message = reason.message.toLowerCase();

  if (
    message.includes("storage/object-not-found") ||
    message.includes("404")
  ) {
    return "Fotoğraf depolama alanına ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
  }

  if (
    message.includes("storage/unauthorized") ||
    message.includes("permission-denied")
  ) {
    return "Fotoğraf yükleme izni reddedildi. Lütfen tekrar deneyin.";
  }

  if (
    message.includes("storage/retry-limit-exceeded") ||
    message.includes("network")
  ) {
    return "Ağ bağlantısı nedeniyle yükleme tamamlanamadı. İnternet bağlantınızı kontrol edin.";
  }

  return reason.message || "Talebiniz gönderilemedi.";
}

export default function SellItemModal({
  open,
  onClose,
}: SellItemModalProps) {
  const { session, authenticated } = usePublicSession();

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [progress, setProgress] =
    useState<"form" | "success">("form");
  const [error, setError] = useState("");

  const registeredName =
    session?.user.displayName?.trim() ||
    session?.user.email?.split("@")[0] ||
    "Kayıtlı Kullanıcı";

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, [previews]);

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

  function resetModal(): void {
    formRef.current?.reset();
    setFiles([]);
    setUploadPercent(0);
    setProgress("form");
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleClose(): void {
    if (submitting) {
      return;
    }

    resetModal();
    onClose();
  }

  function addFiles(list: FileList | null): void {
    if (!list) {
      return;
    }

    const incoming = Array.from(list);

    const invalidType = incoming.find(
      (file) => !ALLOWED_IMAGE_TYPES.has(file.type),
    );

    if (invalidType) {
      setError(
        "Yalnızca JPG, PNG, WebP veya AVIF formatında fotoğraf yükleyebilirsiniz.",
      );
      return;
    }

    const oversized = incoming.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );

    if (oversized) {
      setError(
        `"${oversized.name}" dosyası 10 MB sınırını aşıyor.`,
      );
      return;
    }

    const uniqueFiles = [
      ...files,
      ...incoming,
    ].filter(
      (file, index, allFiles) =>
        allFiles.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        ) === index,
    );

    if (uniqueFiles.length > MAX_FILE_COUNT) {
      setError(
        `En fazla ${MAX_FILE_COUNT} fotoğraf yükleyebilirsiniz.`,
      );
    } else {
      setError("");
    }

    setFiles(
      uniqueFiles.slice(0, MAX_FILE_COUNT),
    );

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFile(indexToRemove: number): void {
    setFiles((current) =>
      current.filter(
        (_, index) => index !== indexToRemove,
      ),
    );

    setError("");
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();

    if (submitting) {
      return;
    }

    addFiles(event.dataTransfer.files);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const form = new FormData(event.currentTarget);

    const fullName = authenticated
      ? registeredName
      : String(form.get("fullName") || "").trim();

    const phone =
      String(form.get("phone") || "").trim();

    const district =
      String(form.get("district") || "").trim();

    const category =
      String(form.get("category") || "").trim();

    const brandModel =
      String(form.get("brandModel") || "").trim();

    const condition =
      String(form.get("condition") || "").trim();

    const description =
      String(form.get("description") || "").trim();

    const expectedPriceRaw =
      String(form.get("expectedPrice") || "").trim();

    if (files.length < 1) {
      setError(
        "Talebi göndermek için en az bir fotoğraf ekleyin.",
      );
      return;
    }

    setSubmitting(true);
    setUploadPercent(0);
    setError("");

    try {
      const requestId = await submitSellRequest(
        {
          fullName,
          phone,
          district,
          category,
          brandModel,
          condition,
          description,
          expectedPrice:
            expectedPriceRaw.length > 0
              ? Number(expectedPriceRaw)
              : undefined,
          files,
        },
        setUploadPercent,
      );

      trackLeadConversion({
        formName: "sell_request",
        transactionId: requestId,
        value:
          expectedPriceRaw.length > 0 &&
          Number.isFinite(Number(expectedPriceRaw))
            ? Math.max(1, Number(expectedPriceRaw))
            : 1,
        currency: "TRY",
        sourcePage: `${window.location.pathname}${window.location.search}`,
      });

      setProgress("success");
      setFiles([]);
      setUploadPercent(100);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (reason: unknown) {
      console.error(
        "Eşya satış talebi gönderilemedi:",
        reason,
      );

      setError(getReadableError(reason));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="sell-modal">
      <button
        type="button"
        className="sell-modal__backdrop"
        aria-label="Pencereyi kapat"
        onClick={handleClose}
        disabled={submitting}
      />

      <section
        className="sell-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sell-modal-title"
        aria-describedby="sell-modal-description"
      >
        <button
          className="sell-modal__close"
          type="button"
          onClick={handleClose}
          aria-label="Kapat"
          disabled={submitting}
        >
          <Icon name="x" />
        </button>

        {progress === "success" ? (
          <div
            className="sell-modal__success"
            role="status"
          >
            <span>
              <Icon
                name="check"
                size={36}
              />
            </span>

            <small>
              TALEBİN BİZE ULAŞTI
            </small>

            <h2>
              Fotoğraflarını inceliyoruz.
            </h2>

            <p>
              Uzman ekibimiz eşyanı
              değerlendirecek ve en kısa
              sürede telefonla sana ulaşacak.
            </p>

            <button
              type="button"
              className="button button--dark"
              onClick={handleClose}
            >
              Tamam, kapat
            </button>
          </div>
        ) : (
          <>
            <header className="sell-modal__header">
              <span className="eyebrow">
                ÜCRETSİZ DEĞERLEME
              </span>

              <h2 id="sell-modal-title">
                Eşyanı göster,
                <br />
                <em>
                  teklifimizi iletelim.
                </em>
              </h2>

              <p id="sell-modal-description">
                Fotoğrafları yükle, kısa
                bilgileri doldur. Konya
                içindeki eşyalar için hızlıca
                değerlendirme yapalım.
              </p>
            </header>

            <form
              ref={formRef}
              className="sell-form"
              onSubmit={submit}
            >
              {authenticated && (
                <div className="sell-form__member">
                  <span>
                    {registeredName
                      .slice(0, 1)
                      .toLocaleUpperCase("tr-TR")}
                  </span>

                  <div>
                    <small>
                      KAYITLI HESAP
                    </small>

                    <strong>
                      Merhaba, {registeredName}
                    </strong>

                    {session?.user.email && (
                      <em>
                        {session.user.email}
                      </em>
                    )}
                  </div>

                  <Icon
                    name="check"
                    size={19}
                  />
                </div>
              )}

              <div className="sell-form__grid">
                {!authenticated && (
                  <label>
                    <span>Ad Soyad *</span>

                    <input
                      name="fullName"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Adınız soyadınız"
                    />
                  </label>
                )}

                <label>
                  <span>Telefon *</span>

                  <input
                    name="phone"
                    required
                    type="tel"
                    minLength={7}
                    maxLength={30}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="05xx xxx xx xx"
                  />
                </label>

                <label>
                  <span>İlçe / Mahalle</span>

                  <input
                    name="district"
                    maxLength={120}
                    autoComplete="address-level2"
                    placeholder="Örn. Selçuklu"
                  />
                </label>

                <label>
                  <span>Eşya kategorisi *</span>

                  <select
                    name="category"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      Seçiniz
                    </option>

                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>Marka / Model</span>

                  <input
                    name="brandModel"
                    maxLength={160}
                    placeholder="Biliyorsanız yazın"
                  />
                </label>

                <label>
                  <span>
                    Eşyanın durumu *
                  </span>

                  <select
                    name="condition"
                    required
                    defaultValue=""
                  >
                    <option
                      value=""
                      disabled
                    >
                      Seçiniz
                    </option>

                    <option value="Çok iyi">
                      Çok iyi
                    </option>

                    <option value="İyi">
                      İyi
                    </option>

                    <option value="Kullanılmış">
                      Kullanılmış
                    </option>

                    <option value="Tamir gerekli">
                      Tamir gerekli
                    </option>
                  </select>
                </label>
              </div>

              <div
                className="sell-upload"
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={submitting}
                  onChange={(
                    event: ChangeEvent<HTMLInputElement>,
                  ) => addFiles(event.target.files)}
                />

                {previews.length > 0 ? (
                  <div className="sell-upload__previews">
                    {previews.map(
                      ({ file, url }, index) => (
                        <figure
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                        >
                          {/* Blob URL önizlemesi Next Image optimizasyonuna uygun değildir. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Eşya fotoğrafı ${index + 1}`}
                          />

                          <button
                            type="button"
                            aria-label="Fotoğrafı kaldır"
                            disabled={submitting}
                            onClick={() =>
                              removeFile(index)
                            }
                          >
                            <Icon
                              name="x"
                              size={14}
                            />
                          </button>
                        </figure>
                      ),
                    )}

                    {files.length <
                      MAX_FILE_COUNT && (
                      <button
                        type="button"
                        className="sell-upload__add"
                        disabled={submitting}
                        onClick={() =>
                          inputRef.current?.click()
                        }
                      >
                        <Icon name="plus" />
                        <span>Ekle</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sell-upload__empty"
                    disabled={submitting}
                    onClick={() =>
                      inputRef.current?.click()
                    }
                  >
                    <span>
                      <Icon
                        name="image"
                        size={28}
                      />
                    </span>

                    <strong>
                      Eşyanın fotoğraflarını ekle
                    </strong>

                    <small>
                      Sürükleyip bırak veya seç ·
                      En fazla 6 fotoğraf
                    </small>
                  </button>
                )}
              </div>

              <label className="sell-form__wide">
                <span>Kısa açıklama *</span>

                <textarea
                  name="description"
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Yaşı, çalışma durumu, varsa kusurları..."
                />
              </label>

              <label className="sell-form__wide">
                <span>
                  Beklediğiniz fiyat
                  (opsiyonel)
                </span>

                <input
                  name="expectedPrice"
                  type="number"
                  min={0}
                  max={999999999999}
                  step={1}
                  inputMode="numeric"
                  placeholder="₺ 0"
                />
              </label>

              {error && (
                <p
                  className="sell-form__error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {submitting && (
                <div
                  className="sell-form__progress"
                  aria-live="polite"
                >
                  <div>
                    <span
                      style={{
                        width: `${uploadPercent}%`,
                      }}
                    />
                  </div>

                  <small>
                    {uploadPercent < 15
                      ? "Fotoğraflar hazırlanıyor"
                      : `Fotoğraflar gönderiliyor · %${uploadPercent}`}
                  </small>
                </div>
              )}

              <button
                type="submit"
                className="button button--dark sell-form__submit"
                disabled={submitting}
              >
                {submitting
                  ? `Gönderiliyor · %${uploadPercent}`
                  : "Ücretsiz teklif iste"}

                <Icon name="arrow-right" />
              </button>

              <small className="sell-form__legal">
                Göndererek bilgilerinizin
                değerlendirme ve iletişim
                amacıyla işlenmesini kabul
                edersiniz.
              </small>
            </form>
          </>
        )}
      </section>
    </div>
  );
}