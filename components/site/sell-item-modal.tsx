"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import Icon from "@/components/ui/icon";
import { usePublicSession } from "@/hooks/use-public-session";
import { trackLeadConversion } from "@/lib/analytics";
import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import { submitSellRequest } from "@/lib/sell-requests";
import { buildWhatsappUrl } from "@/lib/utils";

import styles from "./sell-item-modal.module.css";

/* ------------------------------------------------------------------ */
/* Sabitler                                                            */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { value: "Beyaz Eşya", icon: "fridge", hint: "Buzdolabı, çamaşır, bulaşık, fırın" },
  { value: "Koltuk Takımı", icon: "sofa", hint: "Koltuk, kanepe, berjer" },
  { value: "Mobilya", icon: "layers", hint: "Masa, sandalye, dolap, vitrin" },
  { value: "Yatak Odası", icon: "bed", hint: "Baza, karyola, gardırop" },
  { value: "Televizyon & Elektronik", icon: "tv", hint: "TV, klima, bilgisayar" },
  { value: "Küçük Ev Aleti", icon: "plug", hint: "Süpürge, mikrodalga, ütü" },
  { value: "Diğer", icon: "dots", hint: "Listede olmayan eşyalar" },
] as const;

const CONDITIONS = [
  { value: "Çok iyi", hint: "Az kullanılmış, kusursuz" },
  { value: "İyi", hint: "Normal kullanım izleri" },
  { value: "Kullanılmış", hint: "Belirgin izler var" },
  { value: "Tamir gerekli", hint: "Arızalı veya eksik parça" },
] as const;

const DETAIL_CHIPS = [
  "Sorunsuz çalışıyor",
  "Garantisi devam ediyor",
  "Faturası var",
  "Kutusu var",
  "Sigara içilmeyen evden",
  "Acil satılık",
] as const;

const BRAND_SUGGESTIONS = [
  "Arçelik", "Beko", "Bosch", "Siemens", "Profilo", "Vestel", "Samsung", "LG",
  "Regal", "Altus", "Grundig", "Electrolux", "Whirlpool", "Indesit", "Philips",
  "Sony", "Toshiba", "Tefal", "Fakir", "Arzum", "İstikbal", "Bellona", "Doğtaş",
  "Kelebek", "Yataş", "Enza Home",
];

const KONYA_DISTRICTS = [
  "Selçuklu", "Meram", "Karatay", "Ahırlı", "Akören", "Akşehir", "Altınekin",
  "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak",
  "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar",
  "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Kulu", "Sarayönü", "Seydişehir",
  "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak",
];

const PHOTO_TIPS = [
  "Önden ve yandan, gün ışığında çekin",
  "Marka/model etiketini ekleyin",
  "Çizik ve kusurları gizlemeyin",
];

const STEPS = [
  { key: "item", title: "Eşya", description: "Ne satıyorsunuz?" },
  { key: "photos", title: "Fotoğraflar", description: "En fazla 6 fotoğraf" },
  { key: "details", title: "Detaylar", description: "Durum ve beklenti" },
  { key: "contact", title: "İletişim", description: "Size nasıl ulaşalım?" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const MAX_FILE_COUNT = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;
const DRAFT_KEY = "ugurbeyspot:sell-draft:v2";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

interface SellItemModalProps {
  open: boolean;
  onClose: () => void;
}

interface DraftFields {
  category: string;
  condition: string;
  brandModel: string;
  description: string;
  expectedPrice: string;
  fullName: string;
  phone: string;
  district: string;
}

const EMPTY_DRAFT: DraftFields = {
  category: "",
  condition: "",
  brandModel: "",
  description: "",
  expectedPrice: "",
  fullName: "",
  phone: "",
  district: "",
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

function readDraft(): DraftFields | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftFields>;
    return { ...EMPTY_DRAFT, ...parsed };
  } catch {
    return null;
  }
}

function writeDraft(fields: DraftFields | null): void {
  try {
    if (fields) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(fields));
    } else {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  } catch {
    // Gizli mod / depolama kapalı: taslak tutulmaz.
  }
}

/** "5551234567" → "0555 123 45 67" */
function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length > 0 && !digits.startsWith("0")) digits = `0${digits}`;
  digits = digits.slice(0, 11);

  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)];
  return parts.filter(Boolean).join(" ");
}

function isValidPhone(value: string): boolean {
  return /^05\d{9}$/.test(value.replace(/\D/g, ""));
}

function formatPrice(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  return digits ? Number(digits).toLocaleString("tr-TR") : "";
}

function priceNumber(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
}

function getReadableError(reason: unknown): string {
  if (!(reason instanceof Error)) {
    return "Talebiniz gönderilemedi. Lütfen tekrar deneyin.";
  }

  const message = reason.message.toLowerCase();

  if (message.includes("network") || message.includes("bağlantı")) {
    return "Bağlantı koptuğu için yükleme tamamlanamadı. İnternetinizi kontrol edip tekrar deneyin.";
  }

  if (message.includes("permission-denied")) {
    return "Talep kaydedilemedi. Sayfayı yenileyip tekrar deneyin.";
  }

  return reason.message || "Talebiniz gönderilemedi.";
}

/* ------------------------------------------------------------------ */
/* Bileşen                                                             */
/* ------------------------------------------------------------------ */

export default function SellItemModal({ open, onClose }: SellItemModalProps) {
  const { session, profile, authenticated } = usePublicSession();
  const uid = useId();

  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [fields, setFields] = useState<DraftFields>(EMPTY_DRAFT);
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DraftFields | "files" | "consent", string>>>({});
  const [formError, setFormError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const step: StepKey = STEPS[stepIndex].key;
  const isLastStep = stepIndex === STEPS.length - 1;

  const registeredName =
    profile?.fullName?.trim() ||
    session?.user.displayName?.trim() ||
    session?.user.email?.split("@")[0] ||
    "";

  const contact = DEFAULT_SITE_SETTINGS.contact;

  /* Açılışta taslağı bir kez yükle. */
  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const draft = readDraft();
      const hasDraft = Boolean(
        draft && (draft.category || draft.description || draft.brandModel),
      );

      if (hasDraft && draft) {
        setFields(draft);
      }
      setDraftRestored(hasDraft);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  /* Hesap bilgileri geldiğinde yalnızca boş alanları doldur. */
  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      setFields((current) => ({
        ...current,
        fullName: current.fullName || registeredName,
        phone: current.phone || (profile?.phone ? formatPhone(profile.phone) : ""),
        district: current.district || profile?.district || "",
      }));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, registeredName, profile?.phone, profile?.district]);

  /* Taslak: fotoğraflar hariç tüm alanlar. */
  useEffect(() => {
    if (!open || result) return;
    const timeout = window.setTimeout(() => writeDraft(fields), 250);
    return () => window.clearTimeout(timeout);
  }, [fields, open, result]);

  /* Sayfa kaydırmasını kilitle. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Adım değişince içeriği başa al ve ilk alana odaklan. */
  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: 0 });
    const frame = window.requestAnimationFrame(() => {
      const target = bodyRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], button[aria-pressed], input, textarea",
      );
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stepIndex, open, result]);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () => previews.forEach((item) => URL.revokeObjectURL(item.url)),
    [previews],
  );

  const resetAll = useCallback(() => {
    setStepIndex(0);
    setDirection(1);
    setFields(EMPTY_DRAFT);
    setFiles([]);
    setConsent(false);
    setErrors({});
    setFormError("");
    setUploadPercent(0);
    setResult(null);
    setDraftRestored(false);
  }, []);

  const requestClose = useCallback(() => {
    if (submitting) return;

    if (!result && files.length > 0) {
      const ok = window.confirm(
        "Pencereyi kapatırsanız eklediğiniz fotoğraflar silinecek. Diğer bilgiler taslak olarak saklanır. Kapatılsın mı?",
      );
      if (!ok) return;
    }

    if (result) {
      resetAll();
    } else {
      setFiles([]);
      setErrors({});
      setFormError("");
    }

    onClose();
  }, [files.length, onClose, resetAll, result, submitting]);

  /* Esc ile kapat, Tab ile pencere içinde kal. */
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="file"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, requestClose]);

  function setField<K extends keyof DraftFields>(key: K, value: DraftFields[K]): void {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  /* ---------------- Fotoğraflar ---------------- */

  function addFiles(list: FileList | null): void {
    if (!list || submitting) return;

    const incoming = Array.from(list);
    const rejected: string[] = [];
    const accepted = incoming.filter((file) => {
      const typeOk = ALLOWED_IMAGE_TYPES.has(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (!typeOk) {
        rejected.push(`"${file.name}" desteklenmeyen bir dosya türü`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`"${file.name}" 10 MB'tan büyük`);
        return false;
      }
      return true;
    });

    const merged = [...files, ...accepted].filter(
      (file, index, all) =>
        all.findIndex(
          (other) =>
            other.name === file.name &&
            other.size === file.size &&
            other.lastModified === file.lastModified,
        ) === index,
    );

    if (merged.length > MAX_FILE_COUNT) {
      rejected.push(`en fazla ${MAX_FILE_COUNT} fotoğraf eklenebilir`);
    }

    setFiles(merged.slice(0, MAX_FILE_COUNT));
    setErrors((current) => ({
      ...current,
      files: rejected.length ? `Bazı dosyalar eklenmedi: ${rejected.join(", ")}.` : undefined,
    }));

    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function removeFile(index: number): void {
    setFiles((current) => current.filter((_, i) => i !== index));
    setErrors((current) => ({ ...current, files: undefined }));
  }

  function makeCover(index: number): void {
    setFiles((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  /* ---------------- Doğrulama ve gezinme ---------------- */

  function validateStep(target: StepKey): boolean {
    const next: typeof errors = {};

    if (target === "item") {
      if (!fields.category) next.category = "Eşyanın türünü seçin.";
      if (!fields.condition) next.condition = "Eşyanın durumunu seçin.";
    }

    if (target === "photos" && files.length < 1) {
      next.files = "Değerlendirme için en az bir fotoğraf ekleyin.";
    }

    if (target === "details") {
      const length = fields.description.trim().length;
      if (length < DESCRIPTION_MIN) {
        next.description = `Eşyayı biraz anlatın (en az ${DESCRIPTION_MIN} karakter).`;
      }
    }

    if (target === "contact") {
      if (!authenticated && fields.fullName.trim().length < 2) {
        next.fullName = "Adınızı ve soyadınızı yazın.";
      }
      if (!isValidPhone(fields.phone)) {
        next.phone = "Telefonu 05xx xxx xx xx biçiminde yazın.";
      }
      if (!consent) next.consent = "Devam etmek için aydınlatma metnini onaylayın.";
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      // İlk hatayı görünür alana getir.
      window.requestAnimationFrame(() => {
        bodyRef.current
          ?.querySelector(`.${styles.error}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    return Object.keys(next).length === 0;
  }

  function goTo(index: number): void {
    if (index === stepIndex || submitting) return;

    // İleri atlarken aradaki adımlar da geçerli olmalı.
    if (index > stepIndex) {
      for (let i = stepIndex; i < index; i += 1) {
        if (!validateStep(STEPS[i].key)) {
          if (i !== stepIndex) {
            setDirection(i > stepIndex ? 1 : -1);
            setStepIndex(i);
          }
          return;
        }
      }
    }

    setErrors({});
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
  }

  function goNext(): void {
    if (!validateStep(step)) return;
    if (isLastStep) {
      void submit();
      return;
    }
    goTo(stepIndex + 1);
  }

  function goBack(): void {
    if (stepIndex > 0) goTo(stepIndex - 1);
  }

  function handleFieldKeyDown(event: ReactKeyboardEvent<HTMLElement>): void {
    if (event.key === "Enter" && event.currentTarget.tagName !== "TEXTAREA") {
      event.preventDefault();
      goNext();
    }
  }

  /* ---------------- Gönderim ---------------- */

  async function submit(): Promise<void> {
    if (submitting) return;

    // Son adımda tüm adımlar yeniden kontrol edilir.
    for (let i = 0; i < STEPS.length; i += 1) {
      if (!validateStep(STEPS[i].key)) {
        setDirection(-1);
        setStepIndex(i);
        return;
      }
    }

    setSubmitting(true);
    setUploadPercent(0);
    setFormError("");

    const expectedPrice = priceNumber(fields.expectedPrice);
    const phoneDigits = fields.phone.replace(/\D/g, "");

    try {
      const requestId = await submitSellRequest(
        {
          fullName: authenticated ? registeredName || fields.fullName.trim() : fields.fullName.trim(),
          phone: fields.phone.trim(),
          district: fields.district.trim(),
          category: fields.category,
          brandModel: fields.brandModel.trim(),
          condition: fields.condition,
          description: fields.description.trim().slice(0, DESCRIPTION_MAX),
          expectedPrice,
          files,
        },
        setUploadPercent,
      );

      trackLeadConversion({
        formName: "sell_request",
        transactionId: requestId,
        value: expectedPrice && expectedPrice > 0 ? expectedPrice : 1,
        currency: "TRY",
        sourcePage: `${window.location.pathname}${window.location.search}`,
        userData: {
          email: session?.user.email || undefined,
          phone: phoneDigits,
        },
      });

      writeDraft(null);
      setFiles([]);
      setUploadPercent(100);
      setResult({ id: requestId });
    } catch (reason: unknown) {
      console.error("Eşya satış talebi gönderilemedi:", reason);
      setFormError(getReadableError(reason));
    } finally {
      setSubmitting(false);
    }
  }

  // open yalnızca kullanıcı etkileşimiyle true olur; sunucuda hiç portal açılmaz.
  if (!open) return null;

  /* ---------------- Görünüm parçaları ---------------- */

  const referenceCode = result ? result.id.slice(-6).toLocaleUpperCase("tr-TR") : "";
  const whatsappUrl = buildWhatsappUrl(
    contact.whatsapp,
    result
      ? `Merhaba, ${referenceCode} numaralı eşya satış talebimle ilgili yazıyorum.`
      : "Merhaba, satmak istediğim bir eşya var.",
  );
  const submitStage =
    uploadPercent < 100 ? `Fotoğraflar yükleniyor · %${uploadPercent}` : "Talep kaydediliyor";
  const titleId = `${uid}-title`;

  const summary = [
    { label: "Eşya", value: fields.category || "—", step: 0 },
    { label: "Durum", value: fields.condition || "—", step: 0 },
    { label: "Marka / model", value: fields.brandModel || "Belirtilmedi", step: 0 },
    { label: "Fotoğraf", value: `${files.length} adet`, step: 1 },
    { label: "Beklenti", value: fields.expectedPrice ? `₺${fields.expectedPrice}` : "Teklifinizi bekliyorum", step: 2 },
  ];

  const content = (
    <div className={styles.root} data-state={result ? "success" : "form"}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Pencereyi kapat"
        tabIndex={-1}
        onClick={requestClose}
      />

      <section
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* ---------- Yan panel (masaüstü) ---------- */}
        <aside className={styles.aside} aria-hidden={result ? "true" : undefined}>
          <div className={styles.asideTop}>
            <p className={styles.asideBrand}>Uğur Bey Spot</p>
            <h2 className={styles.asideTitle}>
              Eşyanız <em>değerinde</em> alıcısını bulsun.
            </h2>
          </div>

          {!result && (
            <ol className={styles.stepList}>
              {STEPS.map((item, index) => {
                const state =
                  index < stepIndex ? "done" : index === stepIndex ? "current" : "todo";
                return (
                  <li key={item.key} data-state={state}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      disabled={submitting}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      <span className={styles.stepDot}>
                        {state === "done" ? <Icon name="check" size={14} /> : index + 1}
                      </span>
                      <span className={styles.stepText}>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className={styles.preview} aria-live="polite">
            <div className={styles.previewThumb}>
              {previews[0] ? (
                <img src={previews[0].url} alt="" />
              ) : (
                <Icon name={CATEGORIES.find((c) => c.value === fields.category)?.icon ?? "image"} size={26} />
              )}
            </div>
            <div>
              <strong>{fields.brandModel || fields.category || "Eşyanız"}</strong>
              <span>
                {[fields.condition, files.length ? `${files.length} fotoğraf` : ""]
                  .filter(Boolean)
                  .join(" · ") || "Bilgiler burada görünür"}
              </span>
            </div>
          </div>

          <ul className={styles.trust}>
            <li><Icon name="tag" size={16} /> Teklif almak ücretsiz</li>
            <li><Icon name="shield-check" size={16} /> Bağlayıcı değil, karar sizin</li>
            <li><Icon name="lock" size={16} /> Bilgileriniz yalnızca bu talep için</li>
          </ul>
        </aside>

        {/* ---------- Ana alan ---------- */}
        <div className={styles.main}>
          <header className={styles.topbar}>
            {!result ? (
              <>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={goBack}
                  disabled={stepIndex === 0 || submitting}
                  aria-label="Önceki adım"
                  data-hidden={stepIndex === 0 ? "true" : undefined}
                >
                  <Icon name="arrow-left" size={18} />
                </button>
                <div className={styles.progressWrap}>
                  <span className={styles.progressLabel}>
                    Adım {stepIndex + 1}/{STEPS.length} · {STEPS[stepIndex].title}
                  </span>
                  <span
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={STEPS.length}
                    aria-valuenow={stepIndex + 1}
                    aria-label="Form ilerlemesi"
                  >
                    <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
                  </span>
                </div>
              </>
            ) : (
              <span className={styles.progressLabel}>Talep gönderildi</span>
            )}
            <button
              type="button"
              className={styles.iconButton}
              onClick={requestClose}
              disabled={submitting}
              aria-label="Kapat"
            >
              <Icon name="x" size={18} />
            </button>
          </header>

          <div ref={bodyRef} className={styles.body}>
            {result ? (
              <div className={styles.success} role="status">
                <span className={styles.successMark}>
                  <Icon name="check" size={34} />
                </span>
                <h2 id={titleId}>Talebiniz bize ulaştı</h2>
                <p>
                  Fotoğraflarınızı inceleyip en kısa sürede <strong>{fields.phone}</strong>{" "}
                  numarasından size dönüş yapacağız.
                </p>

                <div className={styles.reference}>
                  <span>Talep numaranız</span>
                  <strong>{referenceCode}</strong>
                </div>

                <ol className={styles.nextSteps}>
                  <li><span>1</span>Fotoğraflar ve bilgiler değerlendirilir.</li>
                  <li><span>2</span>Size telefonla veya WhatsApp&apos;tan teklif iletilir.</li>
                  <li><span>3</span>Teklifi kabul ederseniz teslimi birlikte planlarız.</li>
                </ol>

                <div className={styles.successActions}>
                  {whatsappUrl && (
                    <a className={styles.primary} href={whatsappUrl} target="_blank" rel="noreferrer">
                      <Icon name="message-circle" size={18} />
                      WhatsApp&apos;tan yazın
                    </a>
                  )}
                  <button type="button" className={styles.secondary} onClick={requestClose}>
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={step}
                className={styles.stepPane}
                data-direction={direction === 1 ? "forward" : "back"}
              >
                {step === "item" && (
                  <>
                    <div className={styles.stepHead}>
                      <h2 id={titleId}>Ne satmak istiyorsunuz?</h2>
                      <p>Türünü ve durumunu seçin; marka biliyorsanız ekleyin.</p>
                      {draftRestored && (
                        <p className={styles.note}>
                          <Icon name="save" size={15} /> Yarım kalan talebiniz geri yüklendi.
                        </p>
                      )}
                    </div>

                    <fieldset className={styles.fieldset}>
                      <legend>Eşya türü</legend>
                      <div className={styles.tiles}>
                        {CATEGORIES.map((item, index) => (
                          <button
                            key={item.value}
                            type="button"
                            className={styles.tile}
                            aria-pressed={fields.category === item.value}
                            data-autofocus={index === 0 && !fields.category ? "" : undefined}
                            onClick={() => setField("category", item.value)}
                          >
                            <Icon name={item.icon} size={24} />
                            <strong>{item.value}</strong>
                            <small>{item.hint}</small>
                          </button>
                        ))}
                      </div>
                      {errors.category && <p className={styles.error}>{errors.category}</p>}
                    </fieldset>

                    <fieldset className={styles.fieldset}>
                      <legend>Durumu</legend>
                      <div className={styles.segments}>
                        {CONDITIONS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={styles.segment}
                            aria-pressed={fields.condition === item.value}
                            onClick={() => setField("condition", item.value)}
                          >
                            <strong>{item.value}</strong>
                            <small>{item.hint}</small>
                          </button>
                        ))}
                      </div>
                      {errors.condition && <p className={styles.error}>{errors.condition}</p>}
                    </fieldset>

                    <label className={styles.field}>
                      <span>Marka / model <em>isteğe bağlı</em></span>
                      <input
                        value={fields.brandModel}
                        onChange={(event) => setField("brandModel", event.target.value.slice(0, 120))}
                        onKeyDown={handleFieldKeyDown}
                        list={`${uid}-brands`}
                        placeholder="Örn. Bosch 7 kg çamaşır makinesi"
                        autoComplete="off"
                      />
                      <datalist id={`${uid}-brands`}>
                        {BRAND_SUGGESTIONS.map((brand) => (
                          <option key={brand} value={brand} />
                        ))}
                      </datalist>
                    </label>
                  </>
                )}

                {step === "photos" && (
                  <>
                    <div className={styles.stepHead}>
                      <h2 id={titleId}>Fotoğrafları ekleyin</h2>
                      <p>İlk fotoğraf kapak olur. Net fotoğraf, daha doğru teklif demek.</p>
                    </div>

                    <div
                      className={styles.dropzone}
                      data-active={dragActive ? "true" : undefined}
                      data-filled={files.length ? "true" : undefined}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                    >
                      {files.length > 0 && (
                        <div className={styles.thumbs}>
                          {previews.map((item, index) => (
                            <figure key={`${item.file.name}-${item.file.lastModified}`} className={styles.thumb}>
                              <img src={item.url} alt={`Fotoğraf ${index + 1}`} />
                              {index === 0 ? (
                                <span className={styles.coverBadge}>Kapak</span>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.coverButton}
                                  onClick={() => makeCover(index)}
                                >
                                  Kapak yap
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => removeFile(index)}
                                aria-label={`${index + 1}. fotoğrafı kaldır`}
                              >
                                <Icon name="x" size={14} />
                              </button>
                            </figure>
                          ))}
                          {files.length < MAX_FILE_COUNT && (
                            <button
                              type="button"
                              className={styles.addTile}
                              onClick={() => galleryInputRef.current?.click()}
                            >
                              <Icon name="plus" size={22} />
                              <span>Ekle</span>
                            </button>
                          )}
                        </div>
                      )}

                      {files.length === 0 && (
                        <div className={styles.dropEmpty}>
                          <span className={styles.dropIcon}><Icon name="image" size={28} /></span>
                          <strong>Fotoğrafları sürükleyip bırakın</strong>
                          <small>JPG, PNG, WEBP veya HEIC · her biri en fazla 10 MB</small>
                        </div>
                      )}

                      <div className={styles.dropActions}>
                        <button
                          type="button"
                          className={styles.primary}
                          data-autofocus=""
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={files.length >= MAX_FILE_COUNT}
                        >
                          <Icon name="upload" size={18} />
                          Galeriden seç
                        </button>
                        <button
                          type="button"
                          className={`${styles.secondary} ${styles.cameraOnly}`}
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={files.length >= MAX_FILE_COUNT}
                        >
                          <Icon name="camera" size={18} />
                          Fotoğraf çek
                        </button>
                        <span className={styles.counter}>{files.length}/{MAX_FILE_COUNT}</span>
                      </div>

                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
                        multiple
                        hidden
                        onChange={(event: ChangeEvent<HTMLInputElement>) => addFiles(event.target.files)}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        hidden
                        onChange={(event: ChangeEvent<HTMLInputElement>) => addFiles(event.target.files)}
                      />
                    </div>
                    {errors.files && <p className={styles.error}>{errors.files}</p>}

                    <ul className={styles.tips}>
                      {PHOTO_TIPS.map((tip) => (
                        <li key={tip}><Icon name="check" size={15} /> {tip}</li>
                      ))}
                    </ul>
                  </>
                )}

                {step === "details" && (
                  <>
                    <div className={styles.stepHead}>
                      <h2 id={titleId}>Biraz anlatın</h2>
                      <p>Yaşı, çalışma durumu ve varsa kusurları teklifi netleştirir.</p>
                    </div>

                    <label className={styles.field}>
                      <span>Kısa açıklama</span>
                      <textarea
                        value={fields.description}
                        onChange={(event) =>
                          setField("description", event.target.value.slice(0, DESCRIPTION_MAX))
                        }
                        rows={5}
                        placeholder="Örn. 3 yıllık, sorunsuz çalışıyor, kapağında küçük bir çizik var."
                        aria-invalid={errors.description ? "true" : undefined}
                      />
                      <span className={styles.charCount}>
                        {fields.description.trim().length}/{DESCRIPTION_MAX}
                      </span>
                    </label>
                    {errors.description && <p className={styles.error}>{errors.description}</p>}

                    <div className={styles.chips} aria-label="Hazır ifadeler">
                      {DETAIL_CHIPS.map((chip) => {
                        const active = fields.description
                          .toLocaleLowerCase("tr-TR")
                          .includes(chip.toLocaleLowerCase("tr-TR"));
                        return (
                          <button
                            key={chip}
                            type="button"
                            className={styles.chip}
                            aria-pressed={active}
                            onClick={() => {
                              const text = fields.description.trim();
                              setField(
                                "description",
                                active
                                  ? text
                                      .replace(new RegExp(`[,\\s]*${chip}`, "gi"), "")
                                      .replace(/^[,\s]+/, "")
                                      .trim()
                                  : text
                                    ? `${text}${/[.,]$/.test(text) ? " " : ", "}${chip.charAt(0).toLocaleLowerCase("tr-TR")}${chip.slice(1)}`
                                    : chip,
                              );
                            }}
                          >
                            {active ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}
                            {chip}
                          </button>
                        );
                      })}
                    </div>

                    <label className={styles.field}>
                      <span>Beklediğiniz fiyat <em>isteğe bağlı</em></span>
                      <span className={styles.priceInput}>
                        <i>₺</i>
                        <input
                          inputMode="numeric"
                          value={fields.expectedPrice}
                          onChange={(event) => setField("expectedPrice", formatPrice(event.target.value))}
                          onKeyDown={handleFieldKeyDown}
                          placeholder="Bilmiyorsanız boş bırakın"
                        />
                      </span>
                    </label>
                  </>
                )}

                {step === "contact" && (
                  <>
                    <div className={styles.stepHead}>
                      <h2 id={titleId}>Size nasıl ulaşalım?</h2>
                      <p>Teklifimizi bu numaradan iletiyoruz.</p>
                    </div>

                    {authenticated && registeredName ? (
                      <div className={styles.member}>
                        <span>{registeredName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                        <div>
                          <strong>{registeredName}</strong>
                          <small>{session?.user.email}</small>
                        </div>
                        <Icon name="check" size={18} />
                      </div>
                    ) : (
                      <label className={styles.field}>
                        <span>Ad soyad</span>
                        <input
                          value={fields.fullName}
                          onChange={(event) => setField("fullName", event.target.value.slice(0, 100))}
                          onKeyDown={handleFieldKeyDown}
                          autoComplete="name"
                          placeholder="Adınız soyadınız"
                          aria-invalid={errors.fullName ? "true" : undefined}
                        />
                        {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
                      </label>
                    )}

                    <div className={styles.row}>
                      <label className={styles.field}>
                        <span>Telefon</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={fields.phone}
                          onChange={(event) => setField("phone", formatPhone(event.target.value))}
                          onKeyDown={handleFieldKeyDown}
                          placeholder="05xx xxx xx xx"
                          aria-invalid={errors.phone ? "true" : undefined}
                        />
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                      </label>

                      <label className={styles.field}>
                        <span>İlçe / mahalle <em>isteğe bağlı</em></span>
                        <input
                          value={fields.district}
                          onChange={(event) => setField("district", event.target.value.slice(0, 120))}
                          onKeyDown={handleFieldKeyDown}
                          list={`${uid}-districts`}
                          placeholder="Örn. Selçuklu"
                          autoComplete="address-level2"
                        />
                        <datalist id={`${uid}-districts`}>
                          {KONYA_DISTRICTS.map((district) => (
                            <option key={district} value={district} />
                          ))}
                        </datalist>
                      </label>
                    </div>

                    <div className={styles.summary}>
                      <div className={styles.summaryHead}>
                        <strong>Talep özeti</strong>
                        {previews.length > 0 && (
                          <span className={styles.summaryPhotos}>
                            {previews.slice(0, 4).map((item) => (
                              <img key={item.url} src={item.url} alt="" />
                            ))}
                          </span>
                        )}
                      </div>
                      <dl>
                        {summary.map((row) => (
                          <div key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                            <button type="button" onClick={() => goTo(row.step)} disabled={submitting}>
                              Düzenle
                            </button>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <label className={styles.consent}>
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          setErrors((current) => ({ ...current, consent: undefined }));
                        }}
                      />
                      <span>
                        Bilgilerimin teklif ve iletişim amacıyla işlenmesine ilişkin{" "}
                        <Link href="/kvkk-aydinlatma-metni" target="_blank">
                          KVKK aydınlatma metnini
                        </Link>{" "}
                        okudum.
                      </span>
                    </label>
                    {errors.consent && <p className={styles.error}>{errors.consent}</p>}
                  </>
                )}
              </div>
            )}
          </div>

          {!result && (
            <footer className={styles.footer}>
              {formError && (
                <p className={styles.formError} role="alert">
                  {formError}
                </p>
              )}

              {submitting && (
                <div className={styles.upload} aria-live="polite">
                  <span className={styles.uploadTrack}>
                    <span style={{ width: `${Math.max(6, uploadPercent)}%` }} />
                  </span>
                  <small>{submitStage}</small>
                </div>
              )}

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={stepIndex === 0 ? requestClose : goBack}
                  disabled={submitting}
                >
                  {stepIndex === 0 ? "Vazgeç" : "Geri"}
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={goNext}
                  disabled={submitting}
                  data-busy={submitting ? "true" : undefined}
                >
                  {submitting
                    ? "Gönderiliyor…"
                    : isLastStep
                      ? "Ücretsiz teklif iste"
                      : (
                        <>
                          Devam
                          <span className={styles.nextLabel}>: {STEPS[stepIndex + 1].title}</span>
                        </>
                      )}
                  {!submitting && <Icon name="arrow-right" size={18} />}
                </button>
              </div>
            </footer>
          )}
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
