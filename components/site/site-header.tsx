"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import Icon from "@/components/ui/icon";
import {
  useGlobalSiteSettings,
} from "@/hooks/use-global-site-settings";
import {
  usePublicSession,
} from "@/hooks/use-public-session";
import {
  logoutPublicUser,
} from "@/lib/public-auth";
import type {
  SiteSettings,
} from "@/lib/types";

const NAVIGATION = [
  {
    href: "/",
    label: "Ana Sayfa",
  },
  {
    href: "/hakkimizda",
    label: "Hakkımızda",
  },
  {
    href: "/urunler",
    label: "Ürünler",
  },
  {
    href: "/iletisim",
    label: "İletişim",
  },
] as const;

function isActiveRoute(
  pathname: string,
  href: string,
): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

function getUserName(
  displayName: string | null,
  email: string | null,
): string {
  if (displayName?.trim()) {
    return displayName.trim();
  }

  return (
    email?.split("@")[0] ||
    "Hesabım"
  );
}

export default function SiteHeader({
  settings,
}: {
  settings: SiteSettings;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const {
    settings: globalSettings,
  } = useGlobalSiteSettings();

  const {
    session,
    loading,
    authenticated,
    isAdmin,
  } = usePublicSession();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    accountOpen,
    setAccountOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const accountRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent,
    ): void {
      if (
        accountRef.current &&
        !accountRef.current.contains(
          event.target as Node,
        )
      ) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape"
      ) {
        setMobileOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout():
    Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logoutPublicUser();

      setAccountOpen(false);
      setMobileOpen(false);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error,
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const userName =
    getUserName(
      session?.user.displayName ??
        null,
      session?.user.email ??
        null,
    );

  const initial =
    userName
      .slice(0, 1)
      .toLocaleUpperCase("tr-TR");

  const siteName =
    globalSettings.branding.siteName ||
    settings.branding.siteName;

  const slogan =
    globalSettings.branding.slogan ||
    settings.branding.slogan;

  const headerStyle = {
    "--site-accent":
      globalSettings.branding
        .accentColor,
  } as CSSProperties;

  return (
    <>
      {globalSettings.technical
        .showAnnouncementBar &&
        settings.announcement.status ===
          "active" && (
        <div className="announcement-bar">
          {settings.announcement.href ? (
            <Link
              href={
                settings.announcement
                  .href
              }
            >
              <span>
                {
                  settings.announcement
                    .text
                }
              </span>

              <Icon
                name="arrow-right"
                size={14}
              />
            </Link>
          ) : (
            <span>
              {
                settings.announcement
                  .text
              }
            </span>
          )}
        </div>
      )}

      <header
        className="site-header"
        style={headerStyle}
      >
        <div className="site-container site-header__inner">
          <Link
            href="/"
            className="brand"
            aria-label={`${siteName} ana sayfa`}
          >
            <span className="brand__mark brand__mark--runtime">
              {globalSettings.branding
                .logoMode === "image" &&
              globalSettings.branding
                .logoUrl ? (
                <img
                  src={
                    globalSettings.branding
                      .logoUrl
                  }
                  alt={
                    globalSettings.branding
                      .logoAlt
                  }
                />
              ) : (
                globalSettings.branding
                  .monogram || "UB"
              )}
            </span>

            <span className="brand__text">
              <strong>
                {siteName}
              </strong>

              <small>
                {slogan}
              </small>
            </span>
          </Link>

          <nav
            className="site-nav"
            aria-label="Ana menü"
          >
            {NAVIGATION.map(
              (item) => {
                const active =
                  isActiveRoute(
                    pathname,
                    item.href,
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "is-active"
                        : undefined
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                  >
                    {item.label}
                  </Link>
                );
              },
            )}
          </nav>

          <div className="site-header__actions">
            {!loading &&
              !authenticated && (
                <>
                  <Link
                    href="/giris"
                    className="header-auth-link desktop-only"
                  >
                    Giriş Yap
                  </Link>

                  <Link
                    href="/kayit"
                    className="button button--dark button--compact desktop-only"
                  >
                    Kayıt Ol

                    <Icon
                      name="arrow-right"
                      size={16}
                    />
                  </Link>
                </>
              )}

            {!loading &&
              authenticated && (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="header-admin-button desktop-only"
                    >
                      <Icon
                        name="shield-check"
                        size={16}
                      />

                      Admin
                    </Link>
                  )}

                  <div
                    className="header-account desktop-only"
                    ref={accountRef}
                  >
                    <button
                      type="button"
                      className={
                        `header-account__trigger ${
                          accountOpen
                            ? "is-open"
                            : ""
                        }`
                      }
                      aria-expanded={
                        accountOpen
                      }
                      onClick={() =>
                        setAccountOpen(
                          (current) =>
                            !current,
                        )
                      }
                    >
                      <span className="header-account__avatar">
                        {initial}
                      </span>

                      <span className="header-account__name">
                        {userName}
                      </span>

                      <span className="header-account__chevron">
                        ↓
                      </span>
                    </button>

                    {accountOpen && (
                      <div className="header-account__menu">
                        <div className="header-account__identity">
                          <span className="header-account__avatar header-account__avatar--large">
                            {initial}
                          </span>

                          <div>
                            <strong>
                              {userName}
                            </strong>

                            <small>
                              {
                                session?.user
                                  .email
                              }
                            </small>
                          </div>
                        </div>

                        <div className="header-account__verification">
                          <span
                            className={
                              session?.user
                                .emailVerified
                                ? "is-verified"
                                : "is-pending"
                            }
                          />

                          {session?.user
                            .emailVerified
                            ? "E-posta doğrulandı"
                            : "E-posta doğrulanmadı"}
                        </div>

                        <div className="header-account__links">
                          <Link href="/hesabim">
                            <span>
                              Hesabım
                            </span>

                            <Icon
                              name="arrow-right"
                              size={16}
                            />
                          </Link>

                          {isAdmin && (
                            <Link href="/admin">
                              <span>
                                Yönetim Paneli
                              </span>

                              <Icon
                                name="shield-check"
                                size={16}
                              />
                            </Link>
                          )}
                        </div>

                        <button
                          type="button"
                          className="header-account__logout"
                          disabled={
                            loggingOut
                          }
                          onClick={() =>
                            void handleLogout()
                          }
                        >
                          <Icon
                            name="log-out"
                            size={17}
                          />

                          {loggingOut
                            ? "Çıkış yapılıyor..."
                            : "Çıkış Yap"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

            <button
              type="button"
              className="icon-button mobile-only"
              aria-label={
                mobileOpen
                  ? "Menüyü kapat"
                  : "Menüyü aç"
              }
              aria-expanded={
                mobileOpen
              }
              onClick={() =>
                setMobileOpen(
                  (current) =>
                    !current,
                )
              }
            >
              {mobileOpen ? (
                "×"
              ) : (
                <Icon
                  name="menu"
                  size={21}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={
          `mobile-menu ${
            mobileOpen
              ? "is-open"
              : ""
          }`
        }
        aria-hidden={!mobileOpen}
      >
        <div className="site-container mobile-menu__inner">
          <nav aria-label="Mobil menü">
            {NAVIGATION.map(
              (item, index) => (
                <Link
                  href={item.href}
                  key={item.href}
                >
                  <span>
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  {item.label}

                  <Icon
                    name="arrow-right"
                    size={19}
                  />
                </Link>
              ),
            )}
          </nav>

          <div className="mobile-auth-panel">
            {loading ? (
              <div className="mobile-auth-loading">
                Oturum kontrol ediliyor...
              </div>
            ) : !authenticated ? (
              <div className="mobile-auth-actions">
                <Link
                  href="/giris"
                  className="button button--ghost"
                >
                  Giriş Yap
                </Link>

                <Link
                  href="/kayit"
                  className="button button--dark"
                >
                  Kayıt Ol

                  <Icon
                    name="arrow-right"
                    size={17}
                  />
                </Link>
              </div>
            ) : (
              <>
                <div className="mobile-user">
                  <span className="header-account__avatar header-account__avatar--large">
                    {initial}
                  </span>

                  <div>
                    <strong>
                      {userName}
                    </strong>

                    <small>
                      {
                        session?.user.email
                      }
                    </small>
                  </div>
                </div>

                <div className="mobile-auth-actions">
                  <Link
                    href="/hesabim"
                    className="button button--ghost"
                  >
                    Hesabım
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="button button--dark"
                    >
                      <Icon
                        name="shield-check"
                        size={17}
                      />

                      Admin Paneli
                    </Link>
                  )}

                  <button
                    type="button"
                    className="mobile-logout-button"
                    disabled={
                      loggingOut
                    }
                    onClick={() =>
                      void handleLogout()
                    }
                  >
                    <Icon
                      name="log-out"
                      size={17}
                    />

                    {loggingOut
                      ? "Çıkış yapılıyor..."
                      : "Çıkış Yap"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
