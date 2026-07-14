"use client";

import Link from "next/link";

import {
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
  resendVerificationEmail,
} from "@/lib/public-auth";

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
    processing,
    setProcessing,
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

  async function handleVerification(): Promise<void> {
    setProcessing(true);
    setMessage(null);

    try {
      await resendVerificationEmail();

      setMessage(
        "Doğrulama e-postası yeniden gönderildi.",
      );
    } catch (reason: unknown) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "E-posta gönderilemedi.",
      );
    } finally {
      setProcessing(false);
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
              Hesap ve güvenlik
              bilgilerinizi buradan
              görüntüleyebilirsiniz.
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
                  {session.user
                    .emailVerified
                    ? "Doğrulandı"
                    : "Doğrulanmadı"}
                </dd>
              </div>

              <div>
                <dt>
                  Hesap ID
                </dt>

                <dd className="account-uid">
                  {
                    session.user.uid
                  }
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

            <p>
              E-posta adresinizi
              doğrulayarak hesabınızın
              size ait olduğunu
              doğrulayabilirsiniz.
            </p>

            {!session.user
              .emailVerified && (
              <button
                type="button"
                className="button button--light button--block"
                disabled={processing}
                onClick={() =>
                  void handleVerification()
                }
              >
                Doğrulama E-postası Gönder
              </button>
            )}

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
      </div>
    </main>
  );
}