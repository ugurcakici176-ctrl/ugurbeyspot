"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Icon from "@/components/ui/icon";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  ADMIN_LOGIN_ROUTE,
  logoutAdmin,
} from "@/lib/admin-auth";
import { ROUTES } from "@/lib/constants";

interface AdminNavigationItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: readonly AdminNavigationItem[] = [
  {
    href: ROUTES.adminDashboard,
    label: "Genel Bakış",
    icon: "grid",
  },
  {
    href: ROUTES.adminProducts,
    label: "Ürünler",
    icon: "package",
  },
  {
    href: ROUTES.adminCategories,
    label: "Kategoriler",
    icon: "tag",
  },
  {
    href: ROUTES.adminHomepage,
    label: "Ana Sayfa",
    icon: "home",
  },
  {
    href: ROUTES.adminAbout,
    label: "Hakkımızda",
    icon: "image",
  },
  {
    href: "/admin/bannerlar",
    label: "Bannerlar",
    icon: "sparkles",
  },
  {
    href: ROUTES.adminMessages,
    label: "Mesajlar",
    icon: "inbox",
  },
  {
    href: ROUTES.adminReviews,
    label: "Yorumlar",
    icon: "message-circle",
  },
  {
    href: ROUTES.adminSettings,
    label: "Site Ayarları",
    icon: "settings",
  },
  {
    href: ROUTES.adminSeo,
    label: "SEO",
    icon: "search",
  },
  {
    href: "/admin/yasal-metinler",
    label: "Yasal Metinler",
    icon: "shield-check",
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
    pathname.startsWith(`${href}/`)
  );
}

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const { session } =
    useAdminSession();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen ? "hidden" : "";

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
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [mobileOpen]);

  async function handleLogout(): Promise<void> {
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
    } catch (error) {
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

  return (
    <div className="admin-app">
      <aside
        className={
          `admin-sidebar ${
            mobileOpen ? "is-open" : ""
          }`
        }
        aria-label="Yönetim paneli menüsü"
      >
        <div className="admin-brand">
          <span>UB</span>

          <div>
            <strong>
              Uğur Bey Spot
            </strong>

            <small>
              Yönetim Paneli
            </small>
          </div>
        </div>

        <nav
          className="admin-nav"
          aria-label="Yönetim menüsü"
        >
          <span className="admin-nav__label">
            YÖNETİM
          </span>

          {NAV_ITEMS.map((item) => {
            const active =
              isRouteActive(
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
                <Icon
                  name={item.icon}
                  size={19}
                />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <span className="admin-user__avatar">
              {adminName
                .slice(0, 1)
                .toLocaleUpperCase("tr-TR")}
            </span>

            <div>
              <strong>
                {adminName}
              </strong>

              <small>
                {adminEmail}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout"
            disabled={loggingOut}
            onClick={() =>
              void handleLogout()
            }
          >
            <Icon
              name="log-out"
              size={18}
            />

            {loggingOut
              ? "Çıkış yapılıyor..."
              : "Çıkış Yap"}
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
          <button
            type="button"
            className="admin-mobile-menu"
            aria-label="Yönetim menüsünü aç"
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen(true)
            }
          >
            <Icon
              name="menu"
              size={22}
            />
          </button>

          <div>
            <span>
              UĞUR BEY SPOT
            </span>

            <strong>
              İçerik ve Mağaza Yönetimi
            </strong>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-view-site"
          >
            Siteyi Gör

            <Icon
              name="external-link"
              size={16}
            />
          </a>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
