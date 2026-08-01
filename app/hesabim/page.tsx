"use client";

import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  saveCustomerProfile,
} from "@/lib/customer-profile";
import {
  useRouter,
} from "next/navigation";

import Icon from "@/components/ui/icon";
import LoadingScreen from "@/components/ui/loading-screen";

import {
  usePublicSession,
} from "@/hooks/use-public-session";

import {
  logoutPublicUser,
} from "@/lib/public-auth";
import { getCustomerSellRequests } from "@/lib/sell-requests";
import { getCustomerQuoteRequests } from "@/lib/quote-requests";
import type { QuoteRequest, SellRequest, SellRequestStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const SELL_STATUS_LABELS: Record<SellRequestStatus, string> = {
  new: "Talebiniz Alındı",
  reviewing: "İnceleniyor",
  offered: "Teklif Hazır",
  completed: "Tamamlandı",
  rejected: "Uygun Bulunmadı",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Yeni Talep",
  reviewing: "İnceleniyor",
  offered: "Teklif Hazır",
  closed: "Kapatıldı",
};

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "Bilinmiyor";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Bilinmiyor";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Bugün";
  }

  if (diffDays === 1) {
    return "Dün";
  }

  if (diffDays < 7) {
    return `${diffDays} gün önce`;
  }

  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} hafta önce`;
  }

  return `${Math.floor(diffDays / 30)} ay önce`;
}

function getProviderLabel(providerId: string): string {
  switch (providerId) {
    case "password":
      return "E-posta + Şifre";

    case "google.com":
      return "Google";

    case "apple.com":
      return "Apple";

    default:
      return providerId;
  }
}

interface TimelineItem {
  id: string;
  icon: string;
  label: string;
  date: string;
  type: "sell" | "quote" | "system";
}

export default function AccountPage() {
  const router =
    useRouter();

  const {
  session,
  profile,
  loading,
  profileLoading,
  authenticated,
  isAdmin,
} = usePublicSession();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    verifiedByCode,
    setVerifiedByCode,
  ] = useState(false);

  const [
    verificationModalOpen,
    setVerificationModalOpen,
  ] = useState(false);

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [
    cooldownSeconds,
    setCooldownSeconds,
  ] = useState(0);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    copyingUid,
    setCopyingUid,
  ] = useState(false);
const [
  profileFullName,
  setProfileFullName,
] = useState("");

const [
  profilePhone,
  setProfilePhone,
] = useState("");

const [
  profileDistrict,
  setProfileDistrict,
] = useState("");

const [
  profileSaving,
  setProfileSaving,
] = useState(false);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [sellRequestsLoading, setSellRequestsLoading] = useState(true);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quoteRequestsLoading, setQuoteRequestsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sell" | "quote">("sell");

useEffect(() => {
  if (
    loading ||
    profileLoading ||
    !session
  ) {
    return;
  }

  const timeoutId =
    window.setTimeout(() => {
      setProfileFullName(
        profile?.fullName ||
          session.user.displayName ||
          "",
      );

      setProfilePhone(
        profile?.phone || "",
      );

      setProfileDistrict(
        profile?.district || "",
      );
    }, 0);

  return () => {
    window.clearTimeout(
      timeoutId,
    );
  };
}, [
  loading,
  profileLoading,
  session,
  profile,
]);
  useEffect(() => {
    if (
      !loading &&
      !authenticated
    ) {
      router.replace(
        "/giris",
      );
    }
  }, [
    authenticated,
    loading,
    router,
  ]);

  useEffect(() => {
    if (!session?.user.uid) {
      return;
    }

    let active = true;
    void getCustomerSellRequests()
      .then((items) => {
        if (active) setSellRequests(items);
      })
      .catch((reason: unknown) => {
        console.error("Satış talepleri yüklenemedi:", reason);
      })
      .finally(() => {
        if (active) setSellRequestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user.uid]);

  useEffect(() => {
    if (!session?.user.email) {
      setQuoteRequestsLoading(false);
      return;
    }

    let active = true;
    void getCustomerQuoteRequests()
      .then((items) => {
        if (active) setQuoteRequests(items);
      })
      .catch((reason: unknown) => {
        console.error("Hızlı teklifler yüklenemedi:", reason);
      })
      .finally(() => {
        if (active) setQuoteRequestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user.email]);

  useEffect(() => {
    if (!session?.user.email) {
      return;
    }

    let active = true;

    void fetch(
      `/api/auth/verification-status?email=${encodeURIComponent(session.user.email)}`,
    )
      .then(async (response) => {
        const payload =
          (await response
            .json()
            .catch(() => null)) as {
            verified?: boolean;
          } | null;

        if (!active) {
          return;
        }

        setVerifiedByCode(
          payload?.verified === true,
        );
      })
      .catch(() => {
        if (active) {
          setVerifiedByCode(false);
        }
      })
      .finally(() => undefined);

    return () => {
      active = false;
    };
  }, [session?.user.email]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCooldownSeconds((current) =>
        current > 0
          ? current - 1
          : 0,
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cooldownSeconds]);

  /* ── Profil tamamlama yüzdesi ────── */
  const profileCompletion = useMemo(() => {
    if (!session) return 0;
    let score = 0;
    const totalSteps = 5;
    if (profile?.fullName || session.user.displayName) score++;
    if (profile?.phone) score++;
    if (profile?.district) score++;
    if (session.user.email) score++;
    if (session.user.emailVerified || verifiedByCode) score++;
    return Math.round((score / totalSteps) * 100);
  }, [session, profile, verifiedByCode]);

  /* ── Favori kategoriler ────── */
  const favoriteCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const request of sellRequests) {
      if (request.category) {
        categoryMap.set(request.category, (categoryMap.get(request.category) || 0) + 1);
      }
    }
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [sellRequests]);

  /* ── Aktivite timeline ────── */
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    for (const req of sellRequests) {
      items.push({
        id: `sell-${req.id}`,
        icon: "image",
        label: `Eşya satış talebi gönderildi${req.brandModel ? ` – ${req.brandModel}` : ""}`,
        date: req.createdAt,
        type: "sell",
      });

      if (req.status === "offered" && req.offeredPrice !== undefined) {
        items.push({
          id: `sell-offer-${req.id}`,
          icon: "badge-percent",
          label: `Satış teklifinize ${formatCurrency(req.offeredPrice)} teklif verildi`,
          date: req.updatedAt,
          type: "sell",
        });
      }
    }

    for (const req of quoteRequests) {
      items.push({
        id: `quote-${req.id}`,
        icon: "zap",
        label: `Hızlı teklif talebi gönderildi${req.selectedProducts.length > 0 ? ` – ${req.selectedProducts.length} ürün` : ""}`,
        date: req.createdAt,
        type: "quote",
      });

      if (req.status === "offered" && req.offeredPrice !== undefined) {
        items.push({
          id: `quote-offer-${req.id}`,
          icon: "badge-percent",
          label: `Hızlı teklifinize ${formatCurrency(req.offeredPrice)} fiyat verildi`,
          date: req.updatedAt,
          type: "quote",
        });
      }
    }

    if (session?.user.metadata.creationTime) {
      items.push({
        id: "account-created",
        icon: "user-plus",
        label: "Hesabınız oluşturuldu",
        date: new Date(session.user.metadata.creationTime).toISOString(),
        type: "system",
      });
    }

    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [sellRequests, quoteRequests, session]);

  /* ── İstatistikler ────── */
  const stats = useMemo(() => {
    const totalRequests = sellRequests.length + quoteRequests.length;
    const pendingCount = sellRequests.filter((r) => r.status === "new" || r.status === "reviewing").length
      + quoteRequests.filter((r) => r.status === "new" || r.status === "reviewing").length;
    const offeredCount = sellRequests.filter((r) => r.status === "offered").length
      + quoteRequests.filter((r) => r.status === "offered").length;
    const totalOfferedValue = sellRequests.reduce((sum, r) => sum + (r.offeredPrice || 0), 0)
      + quoteRequests.reduce((sum, r) => sum + (r.offeredPrice || 0), 0);
    return { totalRequests, pendingCount, offeredCount, totalOfferedValue };
  }, [sellRequests, quoteRequests]);

  async function handleLogout(): Promise<void> {
    setProcessing(true);

    try {
      await logoutPublicUser();

      router.replace("/");
      router.refresh();
    } finally {
      setProcessing(false);
    }
  }

  async function handleVerificationSend(): Promise<void> {
    if (!session?.user.email) {
      setError("E-posta bilgisi bulunamadı.");
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/auth/send-verification-code",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as {
          error?: string;
          cooldownSeconds?: number;
        } | null;

      if (!response.ok) {
        setError(
          payload?.error ||
            "Kod gönderilemedi.",
        );

        return;
      }

      setCooldownSeconds(
        typeof payload
          ?.cooldownSeconds ===
          "number"
          ? payload
              .cooldownSeconds
          : 60,
      );

      setVerificationModalOpen(true);

      setMessage(
        "Doğrulama kodu e-posta adresinize gönderildi.",
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Kod gönderilemedi.",
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleVerificationConfirm(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!session?.user.email) {
      setError("E-posta bilgisi bulunamadı.");
      return;
    }

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError("6 haneli kod girin.");
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/auth/verify-code",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
            code: verificationCode,
          }),
        },
      );

      const payload =
        (await response
          .json()
          .catch(() => null)) as {
          error?: string;
        } | null;

      if (!response.ok) {
        setError(
          payload?.error ||
            "Kod doğrulanamadı.",
        );
        return;
      }

      setVerifiedByCode(true);
      window.dispatchEvent(
        new Event(
          "public-email-verification-changed",
        ),
      );
      setVerificationModalOpen(false);
      setVerificationCode("");
      setMessage("Hesabınız başarıyla doğrulandı.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Kod doğrulanamadı.",
      );
    } finally {
      setProcessing(false);
    }
  }

async function handleProfileSave(
  event: FormEvent<HTMLFormElement>,
): Promise<void> {
  event.preventDefault();

  if (profileSaving) {
    return;
  }

  setProfileSaving(true);
  setMessage(null);
  setError(null);

  try {
    await saveCustomerProfile({
      fullName: profileFullName,
      phone: profilePhone,
      district: profileDistrict,
    });

    setMessage(
      "Profil bilgileriniz başarıyla güncellendi. Teklif formlarında bu bilgiler otomatik kullanılacak.",
    );

    router.refresh();
  } catch (reason: unknown) {
    setError(
      reason instanceof Error
        ? reason.message
        : "Profil bilgileriniz güncellenemedi.",
    );
  } finally {
    setProfileSaving(false);
  }
}
  async function handleCopyUid(): Promise<void> {
    if (!session?.user.uid) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setError("Kopyalama bu cihazda desteklenmiyor.");
      return;
    }

    setCopyingUid(true);

    try {
      await navigator.clipboard.writeText(session.user.uid);
      setMessage("Hesap ID panoya kopyalandı.");
      setError(null);
    } catch {
      setError("Hesap ID kopyalanamadı.");
    } finally {
      setCopyingUid(false);
    }
  }

  if (
    loading ||
    !session
  ) {
    return (
      <LoadingScreen label="Hesabınız hazırlanıyor" />
    );
  }

  const displayName =
    session.user.displayName ||
    "Uğur Bey Spot Kullanıcısı";

  const initial =
    displayName
      .slice(0, 1)
      .toLocaleUpperCase("tr-TR");

  const isVerified =
    session.user.emailVerified ||
    verifiedByCode;

  const providers =
    session.user.providerData
      .map((provider) => provider.providerId)
      .filter((providerId): providerId is string => Boolean(providerId));

  const creationDate = formatDateLabel(
    session.user.metadata.creationTime,
  );

  const lastLoginDate = formatDateLabel(
    session.user.metadata.lastSignInTime,
  );

  const securityScore =
    (isVerified ? 45 : 10) +
    (providers.includes("password") ? 30 : 20) +
    (session.user.metadata.creationTime ? 15 : 0) +
    (session.user.metadata.lastSignInTime ? 10 : 0);

  const securityLevel =
    securityScore >= 80
      ? "Yüksek"
      : securityScore >= 55
        ? "Orta"
        : "Temel";

  return (
    <main className="account-page">
      <div className="site-container">
        <div className="account-topbar">
          <Link
            href="/"
            className="brand"
          >
            <span className="brand__mark">
              UB
            </span>

            <span className="brand__text">
              <strong>
                Uğur Bey Spot
              </strong>

              <small>
                Hesabım
              </small>
            </span>
          </Link>

          <Link
            href="/"
            className="button button--ghost button--compact"
          >
            Mağazaya Dön
          </Link>
        </div>

        <section className="account-hero">
          <span className="account-avatar">
            {initial}
          </span>

          <div>
            <span className="eyebrow">
              HESABIM
            </span>

            <h1>
              Hoş geldiniz,
              {" "}
              {displayName}.
            </h1>

            <p>
              Hesap bilgilerinizi, tekliflerinizi ve güvenlik ayarlarınızı
              tek panelden yönetin.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="account-admin-card"
            >
              <Icon
                name="shield-check"
                size={22}
              />

              <div>
                <strong>
                  Yönetim Paneli
                </strong>

                <span>
                  Admin yetkiniz aktif
                </span>
              </div>

              <Icon
                name="arrow-right"
                size={18}
              />
            </Link>
          )}
        </section>

        {message && (
          <div className="form-alert form-alert--success">
            {message}
          </div>
        )}

        {error && (
          <div className="form-alert form-alert--error">
            {error}
          </div>
        )}

        {/* ── PROFİL İLERLEME ÇUBUĞU ────── */}
        <section className="account-progress">
          <div className="account-progress__header">
            <div>
              <span className="eyebrow">PROFİL DURUMU</span>
              <strong>Profiliniz %{profileCompletion} tamamlandı</strong>
            </div>
            <span className="account-progress__badge" data-complete={profileCompletion === 100}>
              {profileCompletion === 100 ? "Tamamlandı" : "Devam ediyor"}
            </span>
          </div>
          <div className="account-progress__bar">
            <div className="account-progress__fill" style={{ width: `${profileCompletion}%` }} />
          </div>
          <div className="account-progress__steps">
            <span data-done={Boolean(profile?.fullName || session.user.displayName)}>
              <Icon name="user" size={14} /> Ad Soyad
            </span>
            <span data-done={Boolean(profile?.phone)}>
              <Icon name="phone" size={14} /> Telefon
            </span>
            <span data-done={Boolean(profile?.district)}>
              <Icon name="map-pin" size={14} /> İlçe
            </span>
            <span data-done={Boolean(session.user.email)}>
              <Icon name="mail" size={14} /> E-posta
            </span>
            <span data-done={isVerified}>
              <Icon name="shield-check" size={14} /> Doğrulama
            </span>
          </div>
        </section>

        {/* ── İSTATİSTİK KARTLARI ────── */}
        <section className="account-highlights">
          <article className="account-highlight-card">
            <span><Icon name="inbox" size={18} /></span>
            <strong>{stats.totalRequests}</strong>
            <small>Toplam Talep</small>
          </article>

          <article className="account-highlight-card">
            <span><Icon name="clock" size={18} /></span>
            <strong>{stats.pendingCount}</strong>
            <small>Bekleyen</small>
          </article>

          <article className="account-highlight-card">
            <span><Icon name="check-circle" size={18} /></span>
            <strong>{stats.offeredCount}</strong>
            <small>Teklifli</small>
          </article>

          <article className="account-highlight-card">
            <span><Icon name="badge-percent" size={18} /></span>
            <strong>{stats.totalOfferedValue > 0 ? formatCurrency(stats.totalOfferedValue) : "—"}</strong>
            <small>Toplam Teklif</small>
          </article>
        </section>

{/* ── MÜŞTERİ PROFİLİ ────── */}
<section className="account-profile-editor">
  <div className="section-heading section-heading--actions">
    <div>
      <span className="eyebrow">
        MÜŞTERİ PROFİLİ
      </span>

      <h2>
        İletişim Bilgilerim
      </h2>

      <p>
        Bu bilgiler hızlı teklif,
        eşya satışı ve iletişim
        formlarında otomatik olarak
        kullanılır.
      </p>
    </div>

    <span
      className={
        profile?.phone
          ? "account-profile-status is-complete"
          : "account-profile-status is-incomplete"
      }
    >
      {profile?.phone
        ? "Profil tamamlandı"
        : "Telefon eksik"}
    </span>
  </div>

  <form
    className="account-profile-form"
    onSubmit={
      handleProfileSave
    }
  >
    <label>
      <span>Ad Soyad *</span>

      <input
        type="text"
        required
        minLength={2}
        maxLength={100}
        autoComplete="name"
        value={profileFullName}
        onChange={(event) =>
          setProfileFullName(
            event.target.value,
          )
        }
        placeholder="Adınız soyadınız"
      />
    </label>

    <label>
      <span>Telefon *</span>

      <input
        type="tel"
        required
        minLength={7}
        maxLength={30}
        inputMode="tel"
        autoComplete="tel"
        value={profilePhone}
        onChange={(event) =>
          setProfilePhone(
            event.target.value,
          )
        }
        placeholder="05xx xxx xx xx"
      />
    </label>

    <label>
      <span>
        İlçe / Mahalle
      </span>

      <input
        type="text"
        maxLength={120}
        autoComplete="address-level2"
        value={profileDistrict}
        onChange={(event) =>
          setProfileDistrict(
            event.target.value,
          )
        }
        placeholder="Örn. Selçuklu"
      />
    </label>

    <label>
      <span>E-posta</span>

      <input
        type="email"
        value={
          session.user.email ||
          ""
        }
        readOnly
        disabled
      />

      <small>
        E-posta adresi hesap
        güvenliği nedeniyle buradan
        değiştirilemez.
      </small>
    </label>

    <div className="account-profile-form__actions">
      <button
        type="submit"
        className="button button--dark"
        disabled={
          profileSaving ||
          profileLoading
        }
      >
        <Icon
          name="save"
          size={18}
        />

        {profileSaving
          ? "Kaydediliyor..."
          : "Bilgilerimi Kaydet"}
      </button>

      <small>
        Kaydettikten sonra yeni
        tekliflerde ad, telefon ve
        e-posta tekrar sorulmaz.
      </small>
    </div>
  </form>
</section>

        {/* ── HESAP BİLGİLERİ + GÜVENLİK ────── */}
        <div className="account-grid">
          <section className="account-panel">
            <span>
              PROFİL
            </span>

            <h2>
              Hesap Bilgileri
            </h2>

            <dl>
              <div>
                <dt>
                  Ad Soyad
                </dt>

                <dd>
                  {profile?.fullName || displayName}
                </dd>
              </div>

              <div>
                <dt>
                  E-posta
                </dt>

                <dd>
                  {
                    session.user.email
                  }
                </dd>
              </div>

<div>
  <dt>Telefon</dt>

  <dd>
    {profile?.phone ||
      "Telefon eklenmemiş"}
  </dd>
</div>
              <div>
                <dt>
                  E-posta Durumu
                </dt>

                <dd>
                  {isVerified
                    ? "Doğrulandı"
                    : "Doğrulanmadı"}
                </dd>
              </div>

              <div>
                <dt>
                  Kayıt Tarihi
                </dt>

                <dd>{creationDate}</dd>
              </div>

              <div>
                <dt>Son Giriş</dt>
                <dd>{lastLoginDate}</dd>
              </div>

              <div>
                <dt>Giriş Yöntemi</dt>
                <dd>
                  {providers.length > 0
                    ? providers.map((providerId) => getProviderLabel(providerId)).join(", ")
                    : "Bilinmiyor"}
                </dd>
              </div>

              <div>
                <dt>Hesap ID</dt>
                <dd className="account-uid-row">
                  <span className="account-uid">{session.user.uid}</span>
                  <button
                    type="button"
                    className="account-inline-button"
                    onClick={() =>
                      void handleCopyUid()
                    }
                    disabled={copyingUid}
                  >
                    {copyingUid ? "Kopyalanıyor" : "Kopyala"}
                  </button>
                </dd>
              </div>
            </dl>
          </section>

          <section className="account-panel account-panel--dark">
            <span>
              GÜVENLİK
            </span>

            <h2>
              Hesap Güvenliği
            </h2>

            <div className="account-security-meter">
              <div>
                <span>Seviye</span>
                <strong>{securityLevel}</strong>
              </div>
              <div>
                <span>Skor</span>
                <strong>{securityScore}/100</strong>
              </div>
            </div>

            <p>
              E-posta adresinizi kod ile doğrulayarak hesabınızın güvenliğini artırın.
            </p>

            {!isVerified && (
              <button
                type="button"
                className="button button--light button--block"
                disabled={processing}
                onClick={() =>
                  void handleVerificationSend()
                }
              >
                Doğrulama Kodu Gönder
              </button>
            )}

            <Link
              href="/iletisim"
              className="button button--outline-light button--block"
            >
              Destek ile İletişime Geç
            </Link>

            <button
              type="button"
              className="account-logout"
              disabled={processing}
              onClick={() =>
                void handleLogout()
              }
            >
              <Icon
                name="log-out"
                size={18}
              />

              Çıkış Yap
            </button>
          </section>
        </div>

        {/* ── TEKLİFLERİM (TAB'lı) ────── */}
        <section className="account-requests-section">
          <div className="section-heading section-heading--actions">
            <div>
              <span className="eyebrow">TALEPLERİM</span>
              <h2>Tekliflerim</h2>
              <p>Satış taleplerinizi ve hızlı tekliflerinizi tek yerden takip edin.</p>
            </div>
            <div className="account-requests-tabs">
              <button
                type="button"
                className={activeTab === "sell" ? "is-active" : ""}
                onClick={() => setActiveTab("sell")}
              >
                <Icon name="image" size={16} />
                Eşya Satışı
                {sellRequests.length > 0 && <em>{sellRequests.length}</em>}
              </button>
              <button
                type="button"
                className={activeTab === "quote" ? "is-active" : ""}
                onClick={() => setActiveTab("quote")}
              >
                <Icon name="zap" size={16} />
                Hızlı Teklifler
                {quoteRequests.length > 0 && <em>{quoteRequests.length}</em>}
              </button>
            </div>
          </div>

          {/* Eşya Satışı Tab */}
          {activeTab === "sell" && (
            <>
              {sellRequestsLoading ? (
                <div className="account-sell-empty">Satış talepleriniz yükleniyor...</div>
              ) : sellRequests.length === 0 ? (
                <div className="account-sell-empty">
                  <span><Icon name="image" size={26} /></span>
                  <div>
                    <strong>Henüz hesabınıza bağlı satış talebi yok.</strong>
                    <small>Giriş yaptıktan sonra göndereceğiniz eşya talepleri burada görünecek.</small>
                  </div>
                  <Link href="/" className="button button--dark button--compact">Eşya gönder</Link>
                </div>
              ) : (
                <div className="account-sell-list">
                  {sellRequests.map((request) => (
                    <article className="account-sell-card" key={request.id}>
                      <div className="account-sell-card__image">
                        {request.images[0] ? <img src={request.images[0].url} alt={request.images[0].alt || request.category} /> : <Icon name="image" size={28} />}
                      </div>
                      <div className="account-sell-card__body">
                        <div className="account-sell-card__top">
                          <div>
                            <small>{request.category}</small>
                            <h3>{request.brandModel || "Eşya değerlendirme talebi"}</h3>
                          </div>
                          <span data-status={request.status}>{SELL_STATUS_LABELS[request.status]}</span>
                        </div>
                        <p>{request.description}</p>
                        <div className="account-sell-card__meta">
                          <span><Icon name="clock" size={15} /> {formatDateLabel(request.createdAt)}</span>
                          <span>{request.images.length} fotoğraf</span>
                        </div>
                        {request.status === "offered" && request.offeredPrice !== undefined && (
                          <div className="account-sell-offer">
                            <div><small>UĞUR BEY SPOT TEKLİFİ</small><strong>{formatCurrency(request.offeredPrice)}</strong></div>
                            <a href="tel:+905520715689" className="button button--dark button--compact"><Icon name="phone" size={17} /> Teklif için ara</a>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Hızlı Teklifler Tab */}
          {activeTab === "quote" && (
            <>
              {quoteRequestsLoading ? (
                <div className="account-sell-empty">Hızlı teklifleriniz yükleniyor...</div>
              ) : quoteRequests.length === 0 ? (
                <div className="account-sell-empty">
                  <span><Icon name="zap" size={26} /></span>
                  <div>
                    <strong>Henüz hızlı teklif talebiniz yok.</strong>
                    <small>Ürün sayfalarından veya sepet üzerinden hızlı teklif gönderebilirsiniz.</small>
                  </div>
                  <Link href="/urunler" className="button button--dark button--compact">Ürünleri incele</Link>
                </div>
              ) : (
                <div className="account-sell-list">
                  {quoteRequests.map((request) => (
                    <article className="account-quote-card" key={request.id}>
                      <div className="account-quote-card__icon">
                        <Icon name="zap" size={24} />
                      </div>
                      <div className="account-sell-card__body">
                        <div className="account-sell-card__top">
                          <div>
                            <small>
                              {request.selectedProducts.length > 0
                                ? `${request.selectedProducts.length} ürün seçildi`
                                : "Genel teklif talebi"}
                            </small>
                            <h3>{request.answers.need || "Hızlı teklif talebi"}</h3>
                          </div>
                          <span data-status={request.status}>{QUOTE_STATUS_LABELS[request.status] || request.status}</span>
                        </div>
                        {request.selectedProducts.length > 0 && (
                          <div className="account-quote-products">
                            {request.selectedProducts.map((product) => (
                              <Link
                                key={product.productId}
                                href={`/urunler/${product.slug}`}
                                className="account-quote-product-chip"
                              >
                                {product.title}
                                <small>{formatCurrency(product.price)}</small>
                              </Link>
                            ))}
                          </div>
                        )}
                        {request.answers.additionalNotes && (
                          <p>{request.answers.additionalNotes}</p>
                        )}
                        <div className="account-sell-card__meta">
                          <span><Icon name="clock" size={15} /> {formatDateLabel(request.createdAt)}</span>
                          <span>Bütçe: {request.answers.budgetRange}</span>
                        </div>
                        {request.status === "offered" && request.offeredPrice !== undefined && (
                          <div className="account-sell-offer">
                            <div><small>UĞUR BEY SPOT TEKLİFİ</small><strong>{formatCurrency(request.offeredPrice)}</strong></div>
                            <a href="tel:+905520715689" className="button button--dark button--compact"><Icon name="phone" size={17} /> Teklif için ara</a>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── AKTİVİTE + FAVORİ KATEGORİLER GRID ────── */}
        <div className="account-bottom-grid">
          {/* Aktivite Zaman Çizelgesi */}
          <section className="account-timeline-section">
            <span className="eyebrow">AKTİVİTE</span>
            <h2>Son Hareketler</h2>

            {timelineItems.length === 0 ? (
              <div className="account-timeline-empty">
                <Icon name="activity" size={24} />
                <span>Henüz aktivite bulunmuyor.</span>
              </div>
            ) : (
              <div className="account-timeline">
                {timelineItems.map((item) => (
                  <div className="account-timeline__item" key={item.id} data-type={item.type}>
                    <span className="account-timeline__dot">
                      <Icon name={item.icon} size={14} />
                    </span>
                    <div className="account-timeline__content">
                      <span>{item.label}</span>
                      <small>{formatRelativeDate(item.date)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Favori Kategoriler */}
          <section className="account-categories-section">
            <span className="eyebrow">İLGİ ALANLARI</span>
            <h2>Favori Kategorilerim</h2>

            {favoriteCategories.length === 0 ? (
              <div className="account-timeline-empty">
                <Icon name="grid" size={24} />
                <span>Henüz kategori verisi bulunmuyor.</span>
              </div>
            ) : (
              <div className="account-fav-categories">
                {favoriteCategories.map((cat) => (
                  <div className="account-fav-cat" key={cat.name}>
                    <div className="account-fav-cat__bar">
                      <div
                        className="account-fav-cat__fill"
                        style={{ width: `${Math.min(100, (cat.count / (favoriteCategories[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="account-fav-cat__label">
                      <strong>{cat.name}</strong>
                      <small>{cat.count} talep</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── HIZLI İŞLEMLER ────── */}
        <section className="account-actions">
          <div className="section-heading section-heading--actions">
            <div>
              <span className="eyebrow">HIZLI İŞLEMLER</span>
              <h2>Hesap Merkezi</h2>
            </div>
          </div>

          <div className="account-actions__grid">
            <Link href="/urunler" className="account-action-card">
              <Icon name="grid" size={20} />
              <div>
                <strong>Ürün Kataloğu</strong>
                <small>Güncel ürünleri inceleyin.</small>
              </div>
              <Icon name="arrow-right" size={17} />
            </Link>

            <Link href="/sepet" className="account-action-card">
              <Icon name="shopping-bag" size={20} />
              <div>
                <strong>Teklif Sepeti</strong>
                <small>Seçili ürünlerle WhatsApp teklifi başlatın.</small>
              </div>
              <Icon name="arrow-right" size={17} />
            </Link>

            <Link href="/iletisim" className="account-action-card">
              <Icon name="message-circle" size={20} />
              <div>
                <strong>Kurumsal Destek</strong>
                <small>info@ugurbeyspot.com ve iletişim kanalları.</small>
              </div>
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>
        </section>
      </div>

      {verificationModalOpen && (
        <div
          className="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Hesap doğrulama kodu"
        >
          <div className="auth-modal__panel">
            <button
              type="button"
              className="auth-modal__close"
              aria-label="Kapat"
              onClick={() => {
                setVerificationModalOpen(false);
                setVerificationCode("");
              }}
            >
              <Icon name="x" size={18} />
            </button>

            <span className="eyebrow">HESAP DOĞRULAMA</span>
            <h2>Kodu girin</h2>
            <p>E-posta adresinize gelen 6 haneli kodu girin.</p>

            <form
              onSubmit={(event) =>
                void handleVerificationConfirm(event)
              }
              className="public-auth-form"
            >
              <label>
                <span>6 Haneli Kod</span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="verification-code-input"
                  placeholder="000000"
                />
              </label>

              <button
                type="submit"
                className="button button--dark button--block"
                disabled={processing}
              >
                {processing
                  ? "Doğrulanıyor..."
                  : "Kodu Doğrula"}
                <Icon name="arrow-right" size={18} />
              </button>

              <button
                type="button"
                className="button button--ghost button--block"
                onClick={() =>
                  void handleVerificationSend()
                }
                disabled={processing || cooldownSeconds > 0}
              >
                {cooldownSeconds > 0
                  ? `Yeniden gönder (${cooldownSeconds}s)`
                  : "Kodu Yeniden Gönder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
