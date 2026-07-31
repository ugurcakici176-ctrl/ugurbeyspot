"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Icon from "@/components/ui/icon";

import {
  useAdminSession,
} from "@/hooks/use-admin-session";

import {
  ADMIN_LOGIN_ROUTE,
  logoutAdmin,
} from "@/lib/admin-auth";

import {
  ROUTES,
} from "@/lib/constants";

interface AdminNavigationItem {
  href: string;
  label: string;
  description: string;
  icon: string;
  group:
    | "commerce"
    | "content"
    | "communication"
    | "system";
}

interface NavigationGroup {
  key:
    | "commerce"
    | "content"
    | "communication"
    | "system";
  label: string;
}

const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    key: "commerce",
    label: "MAĞAZA",
  },
  {
    key: "content",
    label: "İÇERİK",
  },
  {
    key: "communication",
    label: "İLETİŞİM",
  },
  {
    key: "system",
    label: "SİSTEM",
  },
];

const NAV_ITEMS: readonly AdminNavigationItem[] = [
  {
    href: ROUTES.adminDashboard,
    label: "Genel Bakış",
    description:
      "Performans ve güncel özet",
    icon: "grid",
    group: "commerce",
  },
  {
    href: ROUTES.adminProducts,
    label: "Ürünler",
    description:
      "Ürün ve stok yönetimi",
    icon: "package",
    group: "commerce",
  },
  {
    href: ROUTES.adminCategories,
    label: "Kategoriler",
    description:
      "Kategori düzenlemeleri",
    icon: "tag",
    group: "commerce",
  },
  {
    href: "/admin/hizli-teklifler",
    label: "Hızlı Teklifler",
    description:
      "Müşteri teklif talepleri",
    icon: "sparkles",
    group: "commerce",
  },
  {
    href: ROUTES.adminSellRequests,
    label: "Satış Talepleri",
    description: "Fotoğraflı eşya teklifleri",
    icon: "image",
    group: "commerce",
  },
  {
    href: ROUTES.adminHomepage,
    label: "Ana Sayfa",
    description:
      "Ana sayfa içerikleri",
    icon: "home",
    group: "content",
  },
  {
    href: ROUTES.adminAbout,
    label: "Hakkımızda",
    description:
      "Kurumsal içerikler",
    icon: "image",
    group: "content",
  },
  {
    href: "/admin/bannerlar",
    label: "Bannerlar",
    description:
      "Kampanya görselleri",
    icon: "sparkles",
    group: "content",
  },
  {
    href: ROUTES.adminMessages,
    label: "Mesajlar",
    description:
      "Canlı destek ve iletişim",
    icon: "inbox",
    group: "communication",
  },
  {
    href: ROUTES.adminReviews,
    label: "Yorumlar",
    description:
      "Müşteri değerlendirmeleri",
    icon: "message-circle",
    group: "communication",
  },
  {
    href: ROUTES.adminSettings,
    label: "Site Ayarları",
    description:
      "Genel sistem ayarları",
    icon: "settings",
    group: "system",
  },
  {
    href: ROUTES.adminSeo,
    label: "SEO",
    description:
      "Arama motoru ayarları",
    icon: "search",
    group: "system",
  },
  {
    href: "/admin/yasal-metinler",
    label: "Yasal Metinler",
    description:
      "Politika ve sözleşmeler",
    icon: "shield-check",
    group: "system",
  },
];

function isRouteActive(
  pathname: string,
  href: string,
): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

function getInitials(
  value: string,
): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) =>
        part
          .slice(0, 1)
          .toLocaleUpperCase(
            "tr-TR",
          ),
      )
      .join("") || "Y"
  );
}

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const {
    session,
  } = useAdminSession();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

const [
  mounted,
  setMounted,
] = useState(false);

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setMounted(true);
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, []);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        setMobileOpen(false);
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [pathname]);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    if (mobileOpen) {
      document.body.style.overflow =
        "hidden";
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (
        event.key === "Escape"
      ) {
        setMobileOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [mobileOpen]);

  const activeNavigationItem =
    useMemo(
      () =>
        NAV_ITEMS.find((item) =>
          isRouteActive(
            pathname,
            item.href,
          ),
        ) ?? NAV_ITEMS[0],
      [pathname],
    );

  const formattedDate =
    useMemo(() => {
      if (!mounted) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "tr-TR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
        },
      ).format(new Date());
    }, [mounted]);

  async function handleLogout():
    Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logoutAdmin();

      router.replace(
        ADMIN_LOGIN_ROUTE,
      );

      router.refresh();
    } catch (
      error: unknown
    ) {
      console.error(
        "Admin logout error:",
        error,
      );

      window.alert(
        "Çıkış işlemi tamamlanamadı. Tekrar deneyin.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const adminName =
    session?.admin.displayName ||
    "Yönetici";

  const adminEmail =
    session?.admin.email || "";

  const adminInitials =
    getInitials(adminName);

  return (
    <div className="admin-app">
      <aside
        className={`admin-sidebar ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
        aria-label="Yönetim paneli menüsü"
      >
        <div className="admin-sidebar__glow admin-sidebar__glow--one" />
        <div className="admin-sidebar__glow admin-sidebar__glow--two" />

        <div className="admin-brand">
          <Link
            href="/admin"
            className="admin-brand__link"
            aria-label="Yönetim paneli ana sayfa"
          >
            <span className="admin-brand__mark">
              UB

              <span className="admin-brand__pulse" />
            </span>

            <span className="admin-brand__text">
              <strong>
                Uğur Bey Spot
              </strong>

              <small>
                Yönetim Merkezi
              </small>
            </span>
          </Link>

          <button
            type="button"
            className="admin-sidebar__close"
            aria-label="Yönetim menüsünü kapat"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            ×
          </button>
        </div>

        <div className="admin-sidebar__status">
          <span className="admin-sidebar__status-dot" />

          <div>
            <strong>
              Sistem Aktif
            </strong>

            <small>
              Mağaza yönetimi hazır
            </small>
          </div>
        </div>

        <nav
          className="admin-nav"
          aria-label="Yönetim menüsü"
        >
          {NAVIGATION_GROUPS.map(
            (group) => {
              const groupItems =
                NAV_ITEMS.filter(
                  (item) =>
                    item.group ===
                    group.key,
                );

              if (
                groupItems.length ===
                0
              ) {
                return null;
              }

              return (
                <div
                  className="admin-nav__group"
                  key={group.key}
                >
                  <span className="admin-nav__label">
                    {group.label}
                  </span>

                  <div className="admin-nav__items">
                    {groupItems.map(
                      (item) => {
                        const active =
                          isRouteActive(
                            pathname,
                            item.href,
                          );

                        return (
                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
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
                            <span className="admin-nav__icon">
                              <Icon
                                name={
                                  item.icon
                                }
                                size={
                                  19
                                }
                              />
                            </span>

                            <span className="admin-nav__content">
                              <strong>
                                {
                                  item.label
                                }
                              </strong>

                              <small>
                                {
                                  item.description
                                }
                              </small>
                            </span>

                            <span className="admin-nav__arrow">
                              ›
                            </span>
                          </Link>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            },
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <span className="admin-user__avatar">
              {adminInitials}

              <span className="admin-user__online" />
            </span>

            <div className="admin-user__identity">
              <strong>
                {adminName}
              </strong>

              <small>
                {adminEmail ||
                  "Yönetici hesabı"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout"
            disabled={
              loggingOut
            }
            onClick={() =>
              void handleLogout()
            }
          >
            <span className="admin-logout__icon">
              <Icon
                name="log-out"
                size={18}
              />
            </span>

            <span>
              {loggingOut
                ? "Çıkış yapılıyor..."
                : "Güvenli Çıkış"}
            </span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-overlay"
          aria-label="Menüyü kapat"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-mobile-menu"
              aria-label="Yönetim menüsünü aç"
              aria-expanded={
                mobileOpen
              }
              onClick={() =>
                setMobileOpen(true)
              }
            >
              <Icon
                name="menu"
                size={22}
              />
            </button>

            <div className="admin-topbar__page">
              <span>
                UĞUR BEY SPOT
              </span>

              <strong>
                {
                  activeNavigationItem.label
                }
              </strong>
            </div>
          </div>

          <div className="admin-topbar__actions">
            {formattedDate && (
              <div className="admin-topbar__date">
                <span className="admin-topbar__date-dot" />

                <span>
                  {formattedDate}
                </span>
              </div>
            )}

            <div className="admin-topbar__profile">
              <span>
                {adminInitials}
              </span>

              <div>
                <strong>
                  {adminName}
                </strong>

                <small>
                  Yönetici
                </small>
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-view-site"
            >
              <span>
                Siteyi Gör
              </span>

              <Icon
                name="external-link"
                size={16}
              />
            </a>
          </div>
        </header>

        <main className="admin-content">
          <div
            className="admin-content__page"
            key={pathname}
          >
            {children}
          </div>
        </main>

        <footer className="admin-footer">
          <span>
            Uğur Bey Spot Yönetim Sistemi
          </span>

          <span>
            Güvenli yönetim paneli
          </span>
        </footer>
      </div>
    </div>
  );
}
