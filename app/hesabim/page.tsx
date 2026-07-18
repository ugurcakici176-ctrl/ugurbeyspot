"use client";

import Link from "next/link";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

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

function getProviderLabel(providerId: string): string {
  switch (providerId) {
    case "password":
      return "E-posta + Sifre";

    case "google.com":
      return "Google";

    case "apple.com":
      return "Apple";

    default:
      return providerId;
  }
}

export default function AccountPage() {
  const router =
    useRouter();

  const {
    session,
    loading,
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
      setError("E-posta bilgisi bulunamadi.");
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
            "Kod gonderilemedi.",
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
        "Dogrulama kodu e-posta adresinize gonderildi.",
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Kod gonderilemedi.",
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
      setError("E-posta bilgisi bulunamadi.");
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
            "Kod dogrulanamadi.",
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
      setMessage("Hesabiniz basariyla dogrulandi.");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Kod dogrulanamadi.",
      );
    } finally {
      setProcessing(false);
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
      setMessage("Hesap ID panoya kopyalandi.");
      setError(null);
    } catch {
      setError("Hesap ID kopyalanamadi.");
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
      ? "Yuksek"
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
              Hesap bilgilerinizi, dogrulama durumunuzu ve guvenlik aksiyonlarini
              tek panelden yonetin.
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

        <section className="account-highlights">
          <article className="account-highlight-card">
            <span>Hesap Durumu</span>
            <strong>{isVerified ? "Dogrulanmis" : "Dogrulama Bekleniyor"}</strong>
            <small>Kurumsal islemler ve guvenlik icin dogrulama onemlidir.</small>
          </article>

          <article className="account-highlight-card">
            <span>Guvenlik Skoru</span>
            <strong>{securityScore}/100</strong>
            <small>{securityLevel} seviye koruma</small>
          </article>

          <article className="account-highlight-card">
            <span>Destek Maili</span>
            <strong>info@ugurbeyspot.com</strong>
            <small>Kurumsal destek icin bu adresten iletisim kurabilirsiniz.</small>
          </article>
        </section>

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
                  {displayName}
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
                <dt>
                  E-posta Durumu
                </dt>

                <dd>
                  {isVerified
                    ? "Dogrulandi"
                    : "Dogrulanmadi"}
                </dd>
              </div>

              <div>
                <dt>
                  Kayit Tarihi
                </dt>

                <dd>{creationDate}</dd>
              </div>

              <div>
                <dt>Son Giris</dt>
                <dd>{lastLoginDate}</dd>
              </div>

              <div>
                <dt>Giris Yontemi</dt>
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
                    {copyingUid ? "Kopyalaniyor" : "Kopyala"}
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
              E-posta adresinizi kod ile dogrulayarak hesabinizin guvenligini artirin.
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
                Dogrulama Kodu Gonder
              </button>
            )}

            <Link
              href="/iletisim"
              className="button button--outline-light button--block"
            >
              Destek ile Iletisime Gec
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

        <section className="account-actions">
          <div className="section-heading section-heading--actions">
            <div>
              <span className="eyebrow">HIZLI ISLEMLER</span>
              <h2>Hesap Merkezi</h2>
            </div>
          </div>

          <div className="account-actions__grid">
            <Link href="/urunler" className="account-action-card">
              <Icon name="grid" size={20} />
              <div>
                <strong>Urun Katalogu</strong>
                <small>Guncel urunleri inceleyin.</small>
              </div>
              <Icon name="arrow-right" size={17} />
            </Link>

            <Link href="/sepet" className="account-action-card">
              <Icon name="shopping-bag" size={20} />
              <div>
                <strong>Teklif Sepeti</strong>
                <small>Secili urunlerle WhatsApp teklifi baslatin.</small>
              </div>
              <Icon name="arrow-right" size={17} />
            </Link>

            <Link href="/iletisim" className="account-action-card">
              <Icon name="message-circle" size={20} />
              <div>
                <strong>Kurumsal Destek</strong>
                <small>info@ugurbeyspot.com ve iletisim kanallari.</small>
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
          aria-label="Hesap dogrulama kodu"
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

            <span className="eyebrow">HESAP DOGRULAMA</span>
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
                  ? "Dogrulaniyor..."
                  : "Kodu Dogrula"}
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
                  ? `Yeniden gonder (${cooldownSeconds}s)`
                  : "Kodu Yeniden Gonder"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
