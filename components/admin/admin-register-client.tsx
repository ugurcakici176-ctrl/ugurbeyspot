"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import {
  ADMIN_LOGIN_ROUTE,
  isAdminRegistrationEnabled,
  registerAdminCandidate,
  type AdminRegistrationResult,
} from "@/lib/admin-auth";

export default function AdminRegisterClient() {
  const registrationEnabled =
    isAdminRegistrationEnabled();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<AdminRegistrationResult | null>(
      null,
    );

  const [copied, setCopied] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);
    setCopied(false);

    if (
      password !==
      passwordConfirmation
    ) {
      setError(
        "Şifreler birbiriyle eşleşmiyor.",
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Şifre en az 8 karakter olmalıdır.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const registration =
        await registerAdminCandidate(
          email,
          password,
        );

      setResult(registration);
      setPassword("");
      setPasswordConfirmation("");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Hesap oluşturulamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyUid(): Promise<void> {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.uid,
      );

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!registrationEnabled) {
    return (
      <main className="admin-auth-closed">
        <div className="admin-auth-closed__card">
          <span className="admin-auth-closed__mark">
            UB
          </span>

          <span className="admin-auth-eyebrow">
            GÜVENLİK
          </span>

          <h1>
            Yönetici kayıt ekranı kapalı.
          </h1>

          <p>
            Canlı sistemde herkese açık
            yönetici kaydı kullanılmaz.
          </p>

          <Link
            href={ADMIN_LOGIN_ROUTE}
            className="admin-primary-button admin-primary-button--large"
          >
            Giriş Ekranına Dön

            <Icon
              name="arrow-right"
              size={18}
            />
          </Link>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="admin-auth-closed">
        <div className="admin-registration-success">
          <span className="admin-registration-success__icon">
            <Icon
              name="check"
              size={26}
            />
          </span>

          <span className="admin-auth-eyebrow">
            HESAP OLUŞTURULDU
          </span>

          <h1>
            Firebase hesabı hazır.
          </h1>

          <p>
            Bu hesap henüz yönetici
            değildir. Firebase Firestore
            üzerinde aşağıdaki UID ile
            aktif admin belgesi
            oluşturmalısınız.
          </p>

          <div className="admin-registration-uid">
            <span>AUTH UID</span>

            <code>{result.uid}</code>

            <button
              type="button"
              onClick={() =>
                void copyUid()
              }
            >
              {copied
                ? "Kopyalandı"
                : "UID Kopyala"}
            </button>
          </div>

          <div className="admin-registration-instructions">
            <strong>
              Firestore kurulumu
            </strong>

            <p>
              Collection:
              {" "}
              <code>admins</code>
            </p>

            <p>
              Document ID:
              {" "}
              <code>{result.uid}</code>
            </p>

            <pre>{`uid: "${result.uid}"
email: "${result.email}"
displayName: "Uğur Bey"
role: "super_admin"
status: "active"`}</pre>
          </div>

          {result.verificationSent && (
            <div className="admin-notice admin-notice--success">
              E-posta doğrulama bağlantısı
              gönderildi.
            </div>
          )}

          <Link
            href={ADMIN_LOGIN_ROUTE}
            className="admin-primary-button admin-primary-button--large"
          >
            Giriş Ekranına Git

            <Icon
              name="arrow-right"
              size={18}
            />
          </Link>
        </div>
      </main>
    );
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
            YÖNETİCİ KURULUMU
          </small>

          <h1>
            İlk yönetici hesabını hazırlayın.
          </h1>

          <p>
            Hesap oluşturma ve panel
            yetkilendirme birbirinden
            ayrıdır.
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
                Yönetici Kurulumu
              </small>
            </div>
          </div>

          <div className="admin-login__heading">
            <span>
              KURULUM MODU
            </span>

            <h2>
              Hesap Oluştur
            </h2>

            <p>
              Bu ekran yalnızca ilk
              kurulum sırasında açık
              tutulmalıdır.
            </p>
          </div>

          <label className="admin-field">
            <span>E-posta</span>

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
              placeholder="admin@ornek.com"
            />
          </label>

          <label className="admin-field">
            <span>Şifre</span>

            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="En az 8 karakter"
            />
          </label>

          <label className="admin-field">
            <span>Şifre Tekrar</span>

            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={
                passwordConfirmation
              }
              onChange={(event) =>
                setPasswordConfirmation(
                  event.target.value,
                )
              }
              placeholder="Şifrenizi tekrar girin"
            />
          </label>

          {error && (
            <div
              className="admin-notice admin-notice--error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="admin-primary-button"
            type="submit"
            disabled={submitting}
          >
            <Icon
              name="shield-check"
              size={18}
            />

            {submitting
              ? "Hesap oluşturuluyor..."
              : "Firebase Hesabı Oluştur"}
          </button>

          <div className="admin-auth-links">
            <Link href={ADMIN_LOGIN_ROUTE}>
              Zaten hesabım var
            </Link>
          </div>

          <div className="admin-auth-security">
            <Icon
              name="shield-check"
              size={18}
            />

            <p>
              Bu işlem yalnızca Firebase
              Authentication hesabı
              oluşturur. Admin yetkisi
              otomatik verilmez.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
