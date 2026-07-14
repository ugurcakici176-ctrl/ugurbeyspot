"use client";

import Script from "next/script";
import {
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/cookie-consent";
import type {
  GlobalSiteSettings,
} from "@/lib/global-site-settings";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: string,
      action: string,
      parameters?: Record<
        string,
        unknown
      >,
    ) => void;
    fbq?: (
      ...args: unknown[]
    ) => void;
    _fbq?: unknown;
  }
}

function isGa4Id(
  value: string,
): boolean {
  return /^G-[A-Z0-9]+$/i.test(
    value,
  );
}

function isGtmId(
  value: string,
): boolean {
  return /^GTM-[A-Z0-9]+$/i.test(
    value,
  );
}

function isPixelId(
  value: string,
): boolean {
  return /^\d{5,30}$/.test(
    value,
  );
}

export default function IntegrationManager({
  settings,
}: {
  settings: GlobalSiteSettings;
}) {
  const pathname =
    usePathname();

  const [
    consent,
    setConsent,
  ] =
    useState<CookieConsentPreferences | null>(
      null,
    );

  const lastGaPath =
    useRef(pathname);

  const lastMetaPath =
    useRef(pathname);

  useEffect(() => {
    setConsent(
      readCookieConsent(),
    );

    function handleConsentChange(
      event: Event,
    ): void {
      const customEvent =
        event as CustomEvent<CookieConsentPreferences>;

      setConsent(
        customEvent.detail ||
          readCookieConsent(),
      );
    }

    window.addEventListener(
      COOKIE_CONSENT_EVENT,
      handleConsentChange,
    );

    return () => {
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        handleConsentChange,
      );
    };
  }, []);

  const ga4Id =
    settings.integrations.ga4
      .measurementId
      .trim()
      .toUpperCase();

  const gtmId =
    settings.integrations.gtm
      .containerId
      .trim()
      .toUpperCase();

  const pixelId =
    settings.integrations.metaPixel
      .pixelId
      .trim();

  const analyticsAllowed =
    consent?.analytics === true;

  const marketingAllowed =
    consent?.marketing === true;

  const loadGa4 =
    settings.integrations.ga4
      .enabled &&
    analyticsAllowed &&
    isGa4Id(ga4Id);

  const gtmConsentAllowed =
    settings.integrations.gtm
      .consentCategory ===
    "marketing"
      ? marketingAllowed
      : analyticsAllowed;

  const loadGtm =
    settings.integrations.gtm
      .enabled &&
    gtmConsentAllowed &&
    isGtmId(gtmId);

  const loadMetaPixel =
    settings.integrations.metaPixel
      .enabled &&
    marketingAllowed &&
    isPixelId(pixelId);

  useEffect(() => {
    if (
      !loadGa4 ||
      !window.gtag ||
      lastGaPath.current ===
        pathname
    ) {
      return;
    }

    lastGaPath.current =
      pathname;

    window.gtag(
      "event",
      "page_view",
      {
        page_path: pathname,
        page_location:
          window.location.href,
        page_title:
          document.title,
      },
    );
  }, [
    loadGa4,
    pathname,
  ]);

  useEffect(() => {
    if (
      !loadMetaPixel ||
      !window.fbq ||
      lastMetaPath.current ===
        pathname
    ) {
      return;
    }

    lastMetaPath.current =
      pathname;

    window.fbq(
      "track",
      "PageView",
    );
  }, [
    loadMetaPixel,
    pathname,
  ]);

  return (
    <>
      {loadGa4 && (
        <>
          <Script
            id="ugurbey-ga4-library"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />

          <Script
            id="ugurbey-ga4-config"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${ga4Id}', {
                send_page_view: true
              });
            `}
          </Script>
        </>
      )}

      {loadGtm && (
        <Script
          id="ugurbey-gtm"
          strategy="afterInteractive"
        >
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({
                'gtm.start': new Date().getTime(),
                event:'gtm.js'
              });
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {loadMetaPixel && (
        <Script
          id="ugurbey-meta-pixel"
          strategy="afterInteractive"
        >
          {`
            !function(f,b,e,v,n,t,s)
            {
              if(f.fbq)return;
              n=f.fbq=function(){
                n.callMethod?
                n.callMethod.apply(n,arguments):
                n.queue.push(arguments)
              };
              if(!f._fbq)f._fbq=n;
              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];
              t=b.createElement(e);
              t.async=!0;
              t.src=v;
              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(
              window,
              document,
              'script',
              'https://connect.facebook.net/en_US/fbevents.js'
            );

            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
