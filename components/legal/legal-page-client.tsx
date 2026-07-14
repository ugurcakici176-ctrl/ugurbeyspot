"use client";

import {
  useEffect,
  useState,
} from "react";

import SiteChrome from "@/components/site/site-chrome";
import LoadingScreen from "@/components/ui/loading-screen";
import {
  getLegalPage,
  type LegalPageDocument,
  type LegalPageKey,
} from "@/lib/legal-pages";

export default function LegalPageClient({
  pageKey,
}: {
  pageKey: LegalPageKey;
}) {
  const [page, setPage] =
    useState<LegalPageDocument | null>(
      null,
    );

  useEffect(() => {
    let active = true;

    void getLegalPage(pageKey)
      .then((data) => {
        if (!active) {
          return;
        }

        setPage(data);
      })
      .catch((error: unknown) => {
        console.error(
          "Legal page could not be loaded:",
          error,
        );
      });

    return () => {
      active = false;
    };
  }, [pageKey]);

  if (!page) {
    return (
      <LoadingScreen label="Yasal metin hazırlanıyor" />
    );
  }

  return (
    <SiteChrome>
      <section className="legal-hero">
        <div className="site-container">
          <span className="eyebrow">
            {page.eyebrow}
          </span>

          <h1>{page.title}</h1>

          <p>
            {page.description}
          </p>

          <small>
            {page.lastUpdatedLabel}
          </small>
        </div>
      </section>

      <section className="legal-page">
        <div className="site-container legal-page__grid">
          <aside className="legal-page__aside">
            <span>
              İÇİNDEKİLER
            </span>

            <nav aria-label="Sayfa bölümleri">
              {page.sections.map(
                (section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                  >
                    {section.title}
                  </a>
                ),
              )}
            </nav>
          </aside>

          <article className="legal-page__content">
            {page.sections.map(
              (section) => (
                <section
                  id={section.id}
                  key={section.id}
                >
                  <h2>
                    {section.title}
                  </h2>

                  {section.body
                    .split(/\n\s*\n/)
                    .map(
                      (paragraph) =>
                        paragraph.trim(),
                    )
                    .filter(Boolean)
                    .map(
                      (
                        paragraph,
                        index,
                      ) => (
                        <p
                          key={`${section.id}-${index}`}
                        >
                          {paragraph}
                        </p>
                      ),
                    )}
                </section>
              ),
            )}
          </article>
        </div>
      </section>
    </SiteChrome>
  );
}
