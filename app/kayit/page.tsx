"use client";

import Link from "next/link";

import {
  type FormEvent,
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
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);

    if (
      password !==
      passwordRepeat
    ) {
      setError(
        "Şifreler birbiriyle eşleşmiyor.",
      );

      return;
    }

    setSubmitting(true);

    try {
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
          : "Hesap oluşturulamadı.",
      );
    } finally {
      setSubmitting(false);
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
          YENİ HESAP
        </span>

        <h1>
          Aramıza katılın.
        </h1>

        <p>
          Hesabınızı oluşturun ve
          Uğur Bey Spot dijital mağaza
          deneyimine başlayın.
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
              placeholder="Adınız Soyadınız"
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
              Şifre
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
              Şifre Tekrar
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
              placeholder="Şifrenizi tekrar girin"
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
              ? "Hesap oluşturuluyor..."
              : "Hesap Oluştur"}

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
    </main>
  );
}