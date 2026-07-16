"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import Icon from "@/components/ui/icon";
import {
  COOKIE_SETTINGS_EVENT,
  createCookieConsent,
  openCookieSettings,
  readCookieConsent,
  saveCookieConsent,
} from "@/lib/cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] =
    useState(false);

  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [analytics, setAnalytics] =
    useState(false);

  const [marketing, setMarketing] =
    useState(false);

  useEffect(() => {
    const initializeTimeout =
      window.setTimeout(() => {
        const saved =
          readCookieConsent();

        if (saved) {
          setAnalytics(
            saved.analytics,
          );

          setMarketing(
            saved.marketing,
          );
        } else {
          setVisible(true);
        }
      }, 0);

    function handleOpen(): void {
      const current =
        readCookieConsent();

      if (current) {
        setAnalytics(
          current.analytics,
        );

        setMarketing(
          current.marketing,
        );
      }

      setSettingsOpen(true);
      setVisible(true);
    }

    window.addEventListener(
      COOKIE_SETTINGS_EVENT,
      handleOpen,
    );

    return () => {
      window.clearTimeout(
        initializeTimeout,
      );

      window.removeEventListener(
        COOKIE_SETTINGS_EVENT,
        handleOpen,
      );
    };
  }, []);

  function save(
    analyticsValue: boolean,
    marketingValue: boolean,
  ): void {
    saveCookieConsent(
      createCookieConsent(
        analyticsValue,
        marketingValue,
      ),
    );

    setAnalytics(
      analyticsValue,
    );

    setMarketing(
      marketingValue,
    );

    setVisible(false);
    setSettingsOpen(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent__card">
        <div className="cookie-consent__icon">
          <Icon
            name="settings"
            size={22}
          />
        </div>

        <div className="cookie-consent__content">
          <span className="cookie-consent__eyebrow">
            GİZLİLİK TERCİHLERİ
          </span>

          <h2 id="cookie-consent-title">
            Çerez tercihleri sizin kontrolünüzde.
          </h2>

          <p>
            Sitenin temel işlevleri için gerekli
            teknik depolama mekanizmalarını
            kullanıyoruz. Analitik ve pazarlama
            tercihlerini siz belirleyebilirsiniz.{" "}
            <Link href="/cerez-politikasi">
              Çerez Politikası
            </Link>
            {" "}sayfasını inceleyebilirsiniz.
          </p>

          {settingsOpen && (
            <div className="cookie-preferences">
              <div className="cookie-preference">
                <div>
                  <strong>
                    Kesinlikle Gerekli
                  </strong>

                  <span>
                    Güvenlik ve tercih yönetimi için gereklidir.
                  </span>
                </div>

                <span className="cookie-required">
                  Her zaman aktif
                </span>
              </div>

              <label className="cookie-preference">
                <div>
                  <strong>
                    Analitik
                  </strong>

                  <span>
                    Site kullanımını genel olarak anlamaya yardımcı olur.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) =>
                    setAnalytics(
                      event.target.checked,
                    )
                  }
                />
              </label>

              <label className="cookie-preference">
                <div>
                  <strong>
                    Pazarlama
                  </strong>

                  <span>
                    Reklam ve kampanya ölçüm teknolojileri için tercih.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) =>
                    setMarketing(
                      event.target.checked,
                    )
                  }
                />
              </label>
            </div>
          )}
        </div>

        <div className="cookie-consent__actions">
          {!settingsOpen ? (
            <>
              <button
                type="button"
                className="cookie-button cookie-button--ghost"
                onClick={() =>
                  save(false, false)
                }
              >
                İsteğe Bağlıları Reddet
              </button>

              <button
                type="button"
                className="cookie-button cookie-button--ghost"
                onClick={() =>
                  setSettingsOpen(true)
                }
              >
                Tercihleri Yönet
              </button>

              <button
                type="button"
                className="cookie-button cookie-button--dark"
                onClick={() =>
                  save(true, true)
                }
              >
                Tümünü Kabul Et
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="cookie-button cookie-button--ghost"
                onClick={() =>
                  save(false, false)
                }
              >
                İsteğe Bağlıları Reddet
              </button>

              <button
                type="button"
                className="cookie-button cookie-button--dark"
                onClick={() =>
                  save(
                    analytics,
                    marketing,
                  )
                }
              >
                Tercihlerimi Kaydet
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsTrigger() {
  return (
    <button
      type="button"
      className="footer-cookie-button"
      onClick={openCookieSettings}
    >
      Çerez Tercihleri
    </button>
  );
}
