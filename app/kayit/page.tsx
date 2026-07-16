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

import {
  registerPublicUser,
} from "@/lib/public-auth";

export default function RegisterPage() {
  const router =
    useRouter();

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordRepeat,
    setPasswordRepeat,
  ] = useState("");

  const [
    sendingCode,
    setSendingCode,
  ] = useState(false);

  const [
    verifyingAndRegistering,
    setVerifyingAndRegistering,
  ] = useState(false);

  const [
    codeModalOpen,
    setCodeModalOpen,
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
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const intervalId = window.setInterval(
      () => {
        setCooldownSeconds(
          (current) =>
            current > 0
              ? current - 1
              : 0,
        );
      },
      1000,
    );

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [cooldownSeconds]);

  async function sendVerificationCode(): Promise<boolean> {
    const response = await fetch(
      "/api/auth/send-verification-code",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
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
          "Dogrulama kodu gonderilemedi.",
      );

      return false;
    }

    setCooldownSeconds(
      typeof payload
        ?.cooldownSeconds ===
        "number"
        ? payload
            .cooldownSeconds
        : 60,
    );

    setSuccess(
      "Dogrulama kodu e-posta adresinize gonderildi.",
    );

    return true;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (
      password !==
      passwordRepeat
    ) {
      setError(
        "Şifreler birbiriyle eşleşmiyor.",
      );

      return;
    }

    setSendingCode(true);

    try {
      const sent =
        await sendVerificationCode();

      if (sent) {
        setCodeModalOpen(true);
      }
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Dogrulama kodu gonderilemedi.",
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyAndRegister(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setError(
        "6 haneli dogrulama kodu girin.",
      );
      return;
    }

    setVerifyingAndRegistering(
      true,
    );

    try {
      const verifyResponse =
        await fetch(
          "/api/auth/verify-code",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              email,
              code: verificationCode,
            }),
          },
        );

      const verifyPayload =
        (await verifyResponse
          .json()
          .catch(() =>
            null,
          )) as {
          error?: string;
        } | null;

      if (!verifyResponse.ok) {
        setError(
          verifyPayload?.error ||
            "Kod dogrulanamadi.",
        );
        return;
      }

      await registerPublicUser(
        displayName,
        email,
        password,
      );

      router.replace(
        "/hesabim",
      );

      router.refresh();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Hesap olusturulamadi.",
      );
    } finally {
      setVerifyingAndRegistering(
        false,
      );
    }
  }

  async function handleResendCode(): Promise<void> {
    if (cooldownSeconds > 0) {
      return;
    }

    setSendingCode(true);
    setError(null);
    setSuccess(null);

    try {
      await sendVerificationCode();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Kod yeniden gonderilemedi.",
      );
    } finally {
      setSendingCode(false);
    }
  }

  return (
    <main className="public-auth-page public-auth-page--register">
      <Link
        href="/"
        className="public-auth-brand"
      >
        <span>UB</span>

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
          YENI HESAP
        </span>

        <h1>
          Aramiza katilin.
        </h1>

        <p>
          Hesabinizi olusturun ve Uğur Bey Spot dijital magazaya katilin.
        </p>

        <form
          onSubmit={handleSubmit}
          className="public-auth-form"
        >
            <label>
              <span>
                Ad Soyad
              </span>

              <input
                required
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
                autoComplete="name"
                placeholder="Adiniz Soyadiniz"
              />
            </label>

            <label>
              <span>
                E-posta
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                autoComplete="email"
                placeholder="ornek@mail.com"
              />
            </label>

            <label>
              <span>
                Sifre
              </span>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="En az 8 karakter"
              />
            </label>

            <label>
              <span>
                Sifre Tekrar
              </span>

              <input
                type="password"
                required
                minLength={8}
                value={passwordRepeat}
                onChange={(event) =>
                  setPasswordRepeat(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="Sifrenizi tekrar girin"
              />
            </label>

            {error && (
              <div className="form-alert form-alert--error">
                {error}
              </div>
            )}

            {success && (
              <div className="form-alert form-alert--success">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="button button--dark button--block"
              disabled={sendingCode}
            >
              {sendingCode
                ? "Kod gonderiliyor..."
                : "Dogrulama Kodu Gonder"}

              <Icon
                name="arrow-right"
                size={18}
              />
            </button>
        </form>

        <div className="public-auth-footer">
          <span>
            Zaten hesabınız var mı?
          </span>

          <Link href="/giris">
            Giriş Yap
          </Link>
        </div>
      </div>

      {codeModalOpen && (
        <div
          className="auth-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Kayit dogrulama kodu"
        >
          <div className="auth-modal__panel">
            <button
              type="button"
              className="auth-modal__close"
              aria-label="Kapat"
              onClick={() => {
                setCodeModalOpen(false);
                setError(null);
                setSuccess(null);
              }}
            >
              <Icon name="x" size={18} />
            </button>

            <span className="eyebrow">E-POSTA DOGRULAMA</span>
            <h2>Kodu girin</h2>
            <p>
              E-posta adresinize gonderilen 6 haneli kodu girerek kaydi tamamlayin.
            </p>

            <form
              onSubmit={handleVerifyAndRegister}
              className="public-auth-form"
            >
              <div className="form-alert">
                Kod gonderilen e-posta: <strong>{email}</strong>
              </div>

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

              {error && (
                <div className="form-alert form-alert--error">{error}</div>
              )}

              {success && (
                <div className="form-alert form-alert--success">{success}</div>
              )}

              <button
                type="submit"
                className="button button--dark button--block"
                disabled={verifyingAndRegistering}
              >
                {verifyingAndRegistering
                  ? "Dogrulaniyor..."
                  : "Kodu Dogrula ve Hesap Olustur"}

                <Icon name="arrow-right" size={18} />
              </button>

              <div className="public-auth-inline-actions">
                <button
                  type="button"
                  className="button button--ghost button--compact"
                  onClick={() => void handleResendCode()}
                  disabled={sendingCode || cooldownSeconds > 0}
                >
                  {sendingCode
                    ? "Gonderiliyor..."
                    : cooldownSeconds > 0
                      ? `Yeniden gonder (${cooldownSeconds}s)`
                      : "Kodu Yeniden Gonder"}
                </button>

                <button
                  type="button"
                  className="button button--ghost button--compact"
                  onClick={() => {
                    setCodeModalOpen(false);
                    setError(null);
                    setSuccess(null);
                    setVerificationCode("");
                  }}
                >
                  E-postayi Duzenle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}