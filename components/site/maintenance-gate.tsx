"use client";

import Link from "next/link";
import type {
  ReactNode,
} from "react";

import Icon from "@/components/ui/icon";
import {
  usePublicSession,
} from "@/hooks/use-public-session";
import type {
  GlobalSiteSettings,
} from "@/lib/global-site-settings";
import { BRAND_ASSETS } from "@/lib/branding";

export default function MaintenanceGate({
  settings,
  settingsLoading,
  children,
}: {
  settings: GlobalSiteSettings;
  settingsLoading: boolean;
  children: ReactNode;
}) {
  const {
    loading: sessionLoading,
    isAdmin,
  } = usePublicSession();

  if (settingsLoading) {
    return <>{children}</>;
  }

  const canBypass =
    settings.maintenance
      .allowAdminBypass &&
    isAdmin;

  if (
    settings.maintenance.enabled &&
    settings.maintenance.allowAdminBypass &&
    sessionLoading
  ) {
    return <>{children}</>;
  }

  if (
    !settings.maintenance.enabled ||
    canBypass
  ) {
    return <>{children}</>;
  }

  return (
    <main className="maintenance-page">
      <div className="maintenance-page__grid" />

      <div className="maintenance-page__orb maintenance-page__orb--one" />
      <div className="maintenance-page__orb maintenance-page__orb--two" />

      <header className="maintenance-page__header">
        <span className="maintenance-brand">
          <img
            src={settings.branding.logoUrl || BRAND_ASSETS.mark}
            alt={settings.branding.logoAlt || "Uğur Bey Spot logosu"}
          />
        </span>

        <div>
          <strong>
            {
              settings.branding.siteName
            }
          </strong>

          <small>
            {
              settings.branding.slogan
            }
          </small>
        </div>
      </header>

      <section className="maintenance-page__content">
        <span className="maintenance-eyebrow">
          {
            settings.maintenance.eyebrow
          }
        </span>

        <h1>
          {
            settings.maintenance.title
          }
        </h1>

        <p>
          {
            settings.maintenance.description
          }
        </p>

        <div className="maintenance-status-card">
          <span className="maintenance-status-card__pulse" />

          <div>
            <strong>
              {
                settings.maintenance.statusText
              }
            </strong>

            {settings.maintenance
              .estimatedEndText && (
              <span>
                {
                  settings.maintenance
                    .estimatedEndText
                }
              </span>
            )}
          </div>
        </div>

        {settings.maintenance
          .showContactButton &&
          settings.maintenance
            .contactButtonHref && (
          <Link
            className="maintenance-contact"
            href={
              settings.maintenance
                .contactButtonHref
            }
          >
            {
              settings.maintenance
                .contactButtonLabel
            }

            <Icon
              name="arrow-right"
              size={18}
            />
          </Link>
        )}
      </section>

      <footer className="maintenance-page__footer">
        <span>
          © {new Date().getFullYear()}
          {" "}
          {settings.branding.siteName}
        </span>

        <span>
          Sistem durumu · Bakım
        </span>
      </footer>

      <span className="maintenance-page__mark">
        {
          settings.branding.monogram ||
          "UB"
        }
      </span>
    </main>
  );
}
