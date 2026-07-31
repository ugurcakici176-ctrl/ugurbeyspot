"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import QuickQuoteModal from "@/components/site/quick-quote-modal";
import Icon from "@/components/ui/icon";
import { useCart } from "@/hooks/use-cart";
import { useGlobalSiteSettings } from "@/hooks/use-global-site-settings";
import { usePublicSession } from "@/hooks/use-public-session";
import { BRAND_ASSETS } from "@/lib/branding";
import { ROUTES } from "@/lib/constants";
import { logoutPublicUser } from "@/lib/public-auth";
import type { SiteSettings } from "@/lib/types";

interface SiteHeaderProps {
  settings: SiteSettings;
}

interface NavigationItem {
  href: string;
  label: string;
}

const NAVIGATION = [
  {
    key: "home",
    href: ROUTES.home,
  },
  {
    key: "products",
    href: ROUTES.products,
  },
  {
    label: "Konya Spot",
    href: ROUTES.konyaSpot,
  },
  {
    key: "about",
    href: ROUTES.about,
  },
  {
    key: "contact",
    href: ROUTES.contact,
  },
] as const;

const DEFAULT_NAV_LABELS = {
  home: "Ana Sayfa",
  about: "Hakkımızda",
  products: "Ürünler",
  contact: "İletişim",
} as const;

function isActiveRoute(
  pathname: string,
  href: string,
): boolean {
  if (href === ROUTES.home) {
    return pathname === ROUTES.home;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function getUserName(
  displayName: string | null,
  email: string | null,
): string {
  const normalizedDisplayName =
    displayName?.trim();

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const emailName =
    email?.split("@")[0]?.trim();

  return emailName || "Hesabım";
}

function isExternalHref(
  href: string,
): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://")
  );
}

export default function SiteHeader({
  settings,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { totalCount } = useCart();

  const {
    settings: globalSettings,
  } = useGlobalSiteSettings();

  const {
    session,
    loading,
    authenticated,
    isAdmin,
    emailVerified,
  } = usePublicSession();

  const accountRef =
    useRef<HTMLDivElement | null>(null);

  const [quoteOpen, setQuoteOpen] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const navigation =
    useMemo<NavigationItem[]>(
      () =>
        NAVIGATION.map((item) => {
          if ("label" in item) {
            return {
              href: item.href,
              label: item.label,
            };
          }

          return {
            href: item.href,
            label:
              settings.header.navLabels[
                item.key
              ] ||
              DEFAULT_NAV_LABELS[
                item.key
              ],
          };
        }),
      [settings.header.navLabels],
    );

  const userName = getUserName(
    session?.user.displayName ?? null,
    session?.user.email ?? null,
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

  const logoUrl =
    globalSettings.branding.logoUrl ||
    BRAND_ASSETS.mark;

  const logoAlt =
    globalSettings.branding.logoAlt ||
    "Uğur Bey Spot logosu";

  const headerStyle = {
    "--site-accent":
      globalSettings.branding.accentColor,
  } as CSSProperties;

  const primaryCtaLabel =
    settings.header.primaryCtaLabel.trim();

  const primaryCtaHref =
    settings.header.primaryCtaHref.trim();

  const hasPrimaryCta = Boolean(
    primaryCtaLabel &&
      primaryCtaHref,
  );

  const announcementHref =
    settings.announcement.href?.trim() ||
    "";

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        setMobileOpen(false);
        setAccountOpen(false);
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
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
      if (event.key !== "Escape") {
        return;
      }

      setMobileOpen(false);
      setAccountOpen(false);
      setQuoteOpen(false);
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  function closeNavigation(): void {
    setMobileOpen(false);
    setAccountOpen(false);
  }

  function openQuickQuote(): void {
    setMobileOpen(false);
    setAccountOpen(false);
    setQuoteOpen(true);
  }

  function closeQuickQuote(): void {
    setQuoteOpen(false);
  }

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
      setQuoteOpen(false);

      router.replace(ROUTES.home);
      router.refresh();
    } catch (reason: unknown) {
      console.error(
        "Kullanıcı çıkışı başarısız:",
        reason,
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {globalSettings.technical
        .showAnnouncementBar &&
        settings.announcement.status ===
          "active" && (
          <div className="announcement-bar">
            {announcementHref ? (
              isExternalHref(
                announcementHref,
              ) ? (
                <a
                  href={announcementHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>
                    {
                      settings
                        .announcement.text
                    }
                  </span>

                  <Icon
                    name="arrow-right"
                    size={14}
                  />
                </a>
              ) : (
                <Link
                  href={announcementHref}
                  prefetch={false}
                  onClick={
                    closeNavigation
                  }
                >
                  <span>
                    {
                      settings
                        .announcement.text
                    }
                  </span>

                  <Icon
                    name="arrow-right"
                    size={14}
                  />
                </Link>
              )
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
            href={ROUTES.home}
            prefetch={false}
            className="brand"
            aria-label={`${siteName} ana sayfa`}
            onClick={closeNavigation}
          >
            <span className="brand__mark brand__mark--runtime">
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={64}
                height={64}
                priority
                unoptimized
              />
            </span>

            <span className="brand__text">
              <strong>{siteName}</strong>
              <small>{slogan}</small>
            </span>
          </Link>

          <nav
            className="site-nav"
            aria-label="Ana menü"
          >
            {navigation.map((item) => {
              const active =
                isActiveRoute(
                  pathname,
                  item.href,
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
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
                  onClick={
                    closeNavigation
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="site-header__actions">
            <Link
              href={ROUTES.cart}
              prefetch={false}
              className="header-cart-button"
              aria-label={
                totalCount > 0
                  ? `Sepet, ${totalCount} ürün`
                  : "Sepet"
              }
              onClick={closeNavigation}
            >
              <Icon
                name="shopping-bag"
                size={18}
              />

              <span>Sepet</span>

              {totalCount > 0 && (
                <strong
                  aria-label={`${totalCount} ürün`}
                >
                  {totalCount}
                </strong>
              )}
            </Link>

            {hasPrimaryCta && (
              <button
                type="button"
                className="button button--accent button--compact desktop-only"
                onClick={openQuickQuote}
              >
                {primaryCtaLabel}

                <Icon
                  name="arrow-right"
                  size={16}
                />
              </button>
            )}

            {!loading &&
              settings.header
                .showAuthButtons &&
              !authenticated && (
                <>
                  <Link
                    href="/giris"
                    prefetch={false}
                    className="header-auth-link desktop-only"
                    onClick={
                      closeNavigation
                    }
                  >
                    Giriş Yap
                  </Link>

                  <Link
                    href="/kayit"
                    prefetch={false}
                    className="button button--dark button--compact desktop-only"
                    onClick={
                      closeNavigation
                    }
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
                      href={ROUTES.admin}
                      prefetch={false}
                      className="header-admin-button desktop-only"
                      onClick={
                        closeNavigation
                      }
                    >
                      <Icon
                        name="shield-check"
                        size={16}
                      />

                      Admin
                    </Link>
                  )}

                  <div
                    ref={accountRef}
                    className="header-account desktop-only"
                  >
                    <button
                      type="button"
                      className={`header-account__trigger ${
                        accountOpen
                          ? "is-open"
                          : ""
                      }`}
                      aria-expanded={
                        accountOpen
                      }
                      aria-haspopup="menu"
                      aria-controls="header-account-menu"
                      onClick={() => {
                        setAccountOpen(
                          (current) =>
                            !current,
                        );
                      }}
                    >
                      <span className="header-account__avatar">
                        {initial}
                      </span>

                      <span className="header-account__name">
                        {userName}
                      </span>

                      <span
                        className="header-account__chevron"
                        aria-hidden="true"
                      >
                        ↓
                      </span>
                    </button>

                    {accountOpen && (
                      <div
                        id="header-account-menu"
                        className="header-account__menu"
                        role="menu"
                      >
                        <div className="header-account__identity">
                          <span className="header-account__avatar header-account__avatar--large">
                            {initial}
                          </span>

                          <div>
                            <strong>
                              {userName}
                            </strong>

                            {session?.user
                              .email && (
                              <small>
                                {
                                  session
                                    .user
                                    .email
                                }
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="header-account__verification">
                          <span
                            className={
                              emailVerified
                                ? "is-verified"
                                : "is-pending"
                            }
                            aria-hidden="true"
                          />

                          {emailVerified
                            ? "E-posta doğrulandı"
                            : "E-posta doğrulanmadı"}
                        </div>

                        <div className="header-account__links">
                          <Link
                            href="/hesabim"
                            prefetch={false}
                            role="menuitem"
                            onClick={
                              closeNavigation
                            }
                          >
                            <span>
                              Hesabım
                            </span>

                            <Icon
                              name="arrow-right"
                              size={16}
                            />
                          </Link>

                          {isAdmin && (
                            <Link
                              href={
                                ROUTES.admin
                              }
                              prefetch={
                                false
                              }
                              role="menuitem"
                              onClick={
                                closeNavigation
                              }
                            >
                              <span>
                                Yönetim
                                Paneli
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
                          onClick={() => {
                            void handleLogout();
                          }}
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
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-menu"
              onClick={() => {
                setMobileOpen(
                  (current) =>
                    !current,
                );

                setAccountOpen(false);
              }}
            >
              {mobileOpen ? (
                <span aria-hidden="true">
                  ×
                </span>
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
        id="mobile-site-menu"
        className={`mobile-menu ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="site-container mobile-menu__inner">
          <nav aria-label="Mobil menü">
            {navigation.map(
              (item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  aria-current={
                    isActiveRoute(
                      pathname,
                      item.href,
                    )
                      ? "page"
                      : undefined
                  }
                  onClick={
                    closeNavigation
                  }
                >
                  <span aria-hidden="true">
                    {String(
                      index + 1,
                    ).padStart(2, "0")}
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
            <Link
              href={ROUTES.cart}
              prefetch={false}
              className="button button--ghost"
              onClick={closeNavigation}
            >
              <Icon
                name="shopping-bag"
                size={18}
              />

              Sepet

              {totalCount > 0 && (
                <strong>
                  {totalCount}
                </strong>
              )}
            </Link>

            {hasPrimaryCta && (
              <button
                type="button"
                className="button button--accent"
                onClick={
                  openQuickQuote
                }
              >
                {primaryCtaLabel}

                <Icon
                  name="arrow-right"
                  size={17}
                />
              </button>
            )}

            {loading ? (
              <div
                className="mobile-auth-loading"
                role="status"
              >
                Oturum kontrol ediliyor...
              </div>
            ) : !authenticated ? (
              <div className="mobile-auth-actions">
                <Link
                  href="/giris"
                  prefetch={false}
                  className="button button--ghost"
                  onClick={
                    closeNavigation
                  }
                >
                  Giriş Yap
                </Link>

                <Link
                  href="/kayit"
                  prefetch={false}
                  className="button button--dark"
                  onClick={
                    closeNavigation
                  }
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

                    {session?.user.email && (
                      <small>
                        {
                          session.user
                            .email
                        }
                      </small>
                    )}
                  </div>
                </div>

                <div className="mobile-auth-actions">
                  <Link
                    href="/hesabim"
                    prefetch={false}
                    className="button button--ghost"
                    onClick={
                      closeNavigation
                    }
                  >
                    Hesabım
                  </Link>

                  {isAdmin && (
                    <Link
                      href={ROUTES.admin}
                      prefetch={false}
                      className="button button--dark"
                      onClick={
                        closeNavigation
                      }
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
                    onClick={() => {
                      void handleLogout();
                    }}
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

      <QuickQuoteModal
        open={quoteOpen}
        onClose={closeQuickQuote}
        settings={settings}
        sourcePage={pathname}
      />
    </>
  );
}