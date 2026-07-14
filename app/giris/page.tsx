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

  return (
    <main className="public-auth-page">
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
    </main>
  );
}