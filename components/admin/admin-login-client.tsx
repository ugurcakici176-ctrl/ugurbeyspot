"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/ui/icon";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  ADMIN_DASHBOARD_ROUTE,
  ADMIN_REGISTER_ROUTE,
  isAdminRegistrationEnabled,
  loginAsAdmin,
  sendAdminPasswordReset,
} from "@/lib/admin-auth";

type AuthMode =
  | "login"
  | "reset";

export default function AdminLoginClient() {
  const router = useRouter();

  const {
    session,
    loading,
  } = useAdminSession();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const registrationEnabled =
    isAdminRegistrationEnabled();

  useEffect(() => {
    if (
      !loading &&
      session
    ) {
      router.replace(
        ADMIN_DASHBOARD_ROUTE,
      );
    }
  }, [
    loading,
    router,
    session,
  ]);

  function resetMessages(): void {
    setError(null);
    setSuccess(null);
  }

  function changeMode(
    nextMode: AuthMode,
  ): void {
    resetMessages();
    setPassword("");
    setMode(nextMode);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    resetMessages();

    try {
      if (mode === "reset") {
        await sendAdminPasswordReset(
          email,
        );

        setSuccess(
          "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
        );

        return;
      }

      await loginAsAdmin(
        email,
        password,
      );

      router.replace(
        ADMIN_DASHBOARD_ROUTE,
      );

      router.refresh();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "İşlem tamamlanamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <section
        className="admin-login__visual"
        aria-hidden="true"
      >
        <div className="admin-login__visual-content">
          <span>UB</span>

          <small>
            UĞUR BEY SPOT
          </small>

          <h1>
            Mağazanızı tek merkezden yönetin.
          </h1>

          <p>
            Ürünler, içerikler,
            görseller, mesajlar,
            yasal metinler ve SEO
            ayarları.
          </p>
        </div>
      </section>

      <section className="admin-login__form-wrap">
        <form
          className="admin-login__form"
          onSubmit={handleSubmit}
        >
          <div className="admin-login__brand">
            <span>UB</span>

            <div>
              <strong>
                Uğur Bey Spot
              </strong>

              <small>
                Güvenli Yönetim Paneli
              </small>
            </div>
          </div>

          <div className="admin-login__heading">
            <span>
              {mode === "login"
                ? "YÖNETİCİ GİRİŞİ"
                : "ŞİFRE YENİLEME"}
            </span>

            <h2>
              {mode === "login"
                ? "Tekrar Hoş Geldiniz"
                : "Şifrenizi Sıfırlayın"}
            </h2>

            <p>
              {mode === "login"
                ? "Yalnızca yetkilendirilmiş aktif yönetici hesapları panele erişebilir."
                : "Hesabınıza bağlı e-posta adresini girin."}
            </p>
          </div>

          <label className="admin-field">
            <span>E-posta</span>

            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="admin@ornek.com"
            />
          </label>

          {mode === "login" && (
            <label className="admin-field">
              <span>Şifre</span>

              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="••••••••"
              />
            </label>
          )}

          {error && (
            <div
              className="admin-notice admin-notice--error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="admin-notice admin-notice--success"
              role="status"
            >
              {success}
            </div>
          )}

          <button
            className="admin-primary-button"
            type="submit"
            disabled={
              submitting ||
              loading
            }
          >
            <Icon
              name={
                mode === "login"
                  ? "arrow-right"
                  : "mail"
              }
              size={18}
            />

            {submitting
              ? "İşlem yapılıyor..."
              : mode === "login"
                ? "Yönetim Paneline Gir"
                : "Sıfırlama Bağlantısı Gönder"}
          </button>

          <div className="admin-auth-links">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() =>
                  changeMode("reset")
                }
              >
                Şifremi unuttum
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  changeMode("login")
                }
              >
                Giriş ekranına dön
              </button>
            )}

            {registrationEnabled &&
              mode === "login" && (
                <Link
                  href={
                    ADMIN_REGISTER_ROUTE
                  }
                >
                  Kurulum için hesap oluştur
                </Link>
              )}
          </div>

          <div className="admin-auth-security">
            <Icon
              name="shield-check"
              size={18}
            />

            <p>
              Firebase hesabı tek başına
              yönetici yetkisi vermez.
              Firestore üzerindeki aktif
              yönetici kaydı ayrıca
              doğrulanır.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
