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
import { BRAND_ASSETS } from "@/lib/branding";

import {
  usePublicSession,
} from "@/hooks/use-public-session";

import {
  loginPublicUser,
} from "@/lib/public-auth";

export default function LoginPage() {
  const router =
    useRouter();

  const {
    authenticated,
    loading,
  } = usePublicSession();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    resetModalOpen,
    setResetModalOpen,
  ] = useState(false);

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    resetCode,
    setResetCode,
  ] = useState("");

  const [
    resetPassword,
    setResetPassword,
  ] = useState("");

  const [
    resetPasswordRepeat,
    setResetPasswordRepeat,
  ] = useState("");

  const [
    resetStep,
    setResetStep,
  ] = useState<"email" | "code">("email");

  const [
    resetSubmitting,
    setResetSubmitting,
  ] = useState(false);

  const [
    resetCooldownSeconds,
    setResetCooldownSeconds,
  ] = useState(0);

  const [
    resetError,
    setResetError,
  ] = useState<string | null>(null);

  const [
    resetSuccess,
    setResetSuccess,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (resetCooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setResetCooldownSeconds((current) =>
        current > 0 ? current - 1 : 0,
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resetCooldownSeconds]);

  useEffect(() => {
    if (
      !loading &&
      authenticated
    ) {
      router.replace(
        "/hesabim",
      );
    }
  }, [
    authenticated,
    loading,
    router,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const session =
        await loginPublicUser(
          email,
          password,
        );

      router.replace(
        session.isAdmin
          ? "/admin"
          : "/hesabim",
      );

      router.refresh();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Giriş yapılamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function sendResetCode(): Promise<boolean> {
    const response = await fetch("/api/auth/send-password-reset-code", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: resetEmail,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      cooldownSeconds?: number;
    } | null;

    if (!response.ok) {
      setResetError(payload?.error || "Kod gonderilemedi.");
      return false;
    }

    setResetSuccess("Kod gonderildiyse e-posta kutunuza ulasacaktir.");
    setResetCooldownSeconds(
      typeof payload?.cooldownSeconds === "number"
        ? payload.cooldownSeconds
        : 60,
    );

    return true;
  }

  async function handleResetSend(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setResetSubmitting(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const sent = await sendResetCode();
      if (sent) {
        setResetStep("code");
      }
    } catch (reason: unknown) {
      setResetError(reason instanceof Error ? reason.message : "Kod gonderilemedi.");
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleResetComplete(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setResetSubmitting(true);
    setResetError(null);
    setResetSuccess(null);

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setResetError("6 haneli kod girin.");
      setResetSubmitting(false);
      return;
    }

    if (resetPassword.length < 8) {
      setResetError("Yeni sifre en az 8 karakter olmali.");
      setResetSubmitting(false);
      return;
    }

    if (resetPassword !== resetPasswordRepeat) {
      setResetError("Sifreler eslesmiyor.");
      setResetSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password-with-code", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword: resetPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setResetError(payload?.error || "Sifre sifirlama tamamlanamadi.");
        return;
      }

      setResetSuccess("Sifreniz basariyla guncellendi. Yeni sifrenizle giris yapabilirsiniz.");
      setPassword("");
      setResetCode("");
      setResetPassword("");
      setResetPasswordRepeat("");
    } catch (reason: unknown) {
      setResetError(reason instanceof Error ? reason.message : "Sifre sifirlama tamamlanamadi.");
    } finally {
      setResetSubmitting(false);
    }
  }

  return (
    <main className="public-auth-page">
      <Link
        href="/"
        className="public-auth-brand"
      >
        <span>
          <img src={BRAND_ASSETS.mark} alt="" aria-hidden="true" />
        </span>

        <div>
          <strong>
            Uğur Bey Spot
          </strong>

          <small>
            Dijital Mağaza
          </small>
        </div>
      </Link>

      <div className="public-auth-card">
        <span className="eyebrow">
          HESABINIZA GİRİN
        </span>

        <h1>
          Tekrar hoş geldiniz.
        </h1>

        <p>
          Hesabınıza giriş yaparak
          mağaza deneyiminize kaldığınız
          yerden devam edin.
        </p>

        <form
          onSubmit={handleSubmit}
          className="public-auth-form"
        >
          <label>
            <span>
              E-posta
            </span>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="ornek@mail.com"
            />
          </label>

          <label>
            <span>
              Şifre
            </span>

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

          {error && (
            <div className="form-alert form-alert--error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button--dark button--block"
            disabled={submitting}
          >
            {submitting
              ? "Giriş yapılıyor..."
              : "Giriş Yap"}

            <Icon
              name="arrow-right"
              size={18}
            />
          </button>

          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() => {
              setResetEmail(email);
              setResetModalOpen(true);
              setResetStep("email");
              setResetError(null);
              setResetSuccess(null);
            }}
          >
            Sifremi Unuttum
          </button>
        </form>

        <div className="public-auth-footer">
          <span>
            Henüz hesabınız yok mu?
          </span>

          <Link href="/kayit">
            Kayıt Ol
          </Link>
        </div>
      </div>

      {resetModalOpen && (
        <div
          className="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Sifre sifirlama"
        >
          <div className="auth-modal__panel">
            <button
              type="button"
              className="auth-modal__close"
              aria-label="Kapat"
              onClick={() => setResetModalOpen(false)}
            >
              <Icon name="x" size={18} />
            </button>

            <span className="eyebrow">SIFRE SIFIRLAMA</span>
            <h2>{resetStep === "email" ? "Kod gonder" : "Kodu dogrula"}</h2>
            <p>
              {resetStep === "email"
                ? "E-posta adresinizi girin, 6 haneli sifre sifirlama kodunu gonderelim."
                : "Mailinize gelen kodu ve yeni sifrenizi girin."}
            </p>

            {resetStep === "email" ? (
              <form className="public-auth-form" onSubmit={handleResetSend}>
                <label>
                  <span>E-posta</span>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="ornek@mail.com"
                  />
                </label>

                {resetError && <div className="form-alert form-alert--error">{resetError}</div>}
                {resetSuccess && <div className="form-alert form-alert--success">{resetSuccess}</div>}

                <button
                  type="submit"
                  className="button button--dark button--block"
                  disabled={resetSubmitting}
                >
                  {resetSubmitting ? "Kod gonderiliyor..." : "Kodu Gonder"}
                  <Icon name="arrow-right" size={18} />
                </button>
              </form>
            ) : (
              <form className="public-auth-form" onSubmit={handleResetComplete}>
                <label>
                  <span>6 Haneli Kod</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(event) =>
                      setResetCode(event.target.value.replace(/\D/g, ""))
                    }
                    inputMode="numeric"
                    className="verification-code-input"
                    placeholder="000000"
                  />
                </label>

                <label>
                  <span>Yeni Sifre</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="En az 8 karakter"
                  />
                </label>

                <label>
                  <span>Yeni Sifre Tekrar</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetPasswordRepeat}
                    onChange={(event) => setResetPasswordRepeat(event.target.value)}
                    placeholder="Sifreyi tekrar girin"
                  />
                </label>

                {resetError && <div className="form-alert form-alert--error">{resetError}</div>}
                {resetSuccess && <div className="form-alert form-alert--success">{resetSuccess}</div>}

                <button
                  type="submit"
                  className="button button--dark button--block"
                  disabled={resetSubmitting}
                >
                  {resetSubmitting ? "Guncelleniyor..." : "Sifreyi Guncelle"}
                  <Icon name="arrow-right" size={18} />
                </button>

                <div className="public-auth-inline-actions">
                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    onClick={() => void sendResetCode()}
                    disabled={resetSubmitting || resetCooldownSeconds > 0}
                  >
                    {resetCooldownSeconds > 0
                      ? `Yeniden gonder (${resetCooldownSeconds}s)`
                      : "Kodu Yeniden Gonder"}
                  </button>

                  <button
                    type="button"
                    className="button button--ghost button--compact"
                    onClick={() => setResetStep("email")}
                  >
                    E-postayi Duzenle
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
