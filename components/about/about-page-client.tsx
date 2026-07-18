"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import SiteChrome from "@/components/site/site-chrome";
import EmptyState from "@/components/ui/empty-state";
import Icon from "@/components/ui/icon";
import { getAboutContent } from "@/lib/site-content";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/default-content";
import type { AboutContent } from "@/lib/types";

type LoadStatus = "loading" | "success" | "error";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallback: React.ReactNode;
};

function ImageWithFallback({
  src,
  alt,
  className,
  loading = "lazy",
  fallback,
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function AboutPageClient() {
  const [content, setContent] = useState<AboutContent | null>(DEFAULT_ABOUT_CONTENT);
  const [status, setStatus] = useState<LoadStatus>("success");
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const data = await getAboutContent();

      setContent(data);
      setStatus("success");
    } catch (reason: unknown) {
      console.error("About content could not be loaded:", reason);

      setContent(null);
      setStatus("error");
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "Hakkımızda içeriği şu anda yüklenemedi.",
      );
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const data = await getAboutContent();

        if (!active) return;

        setContent(data);
        setStatus("success");
      } catch (reason: unknown) {
        console.error("About content could not be loaded:", reason);

        if (!active) return;

        setContent(null);
        setStatus("error");
        setError(
          reason instanceof Error && reason.message
            ? reason.message
            : "Hakkımızda içeriği şu anda yüklenemedi.",
        );
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  const sortedValues = useMemo(() => {
    return [...(content?.values.items ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [content?.values.items]);

  const sortedStatistics = useMemo(() => {
    return [...(content?.statistics.items ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [content?.statistics.items]);

  const sortedGalleryImages = useMemo(() => {
    return [...(content?.gallery.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [content?.gallery.images]);

  if (status === "error" || !content) {
    return (
      <SiteChrome>
        <main>
          <section className="page-shell" aria-labelledby="about-error-title">
            <div className="site-container">
              <EmptyState
                title="İçerik görüntülenemiyor"
                description={error || "Lütfen daha sonra tekrar deneyin."}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  className="site-button site-button--primary"
                  onClick={() => void loadContent()}
                >
                  <Icon name="refresh" size={18} />
                  Tekrar Dene
                </button>
              </div>
            </div>
          </section>
        </main>
      </SiteChrome>
    );
  }

  const heroTitle = content.hero.title?.trim() || "Uğur Bey Spot";
  const heroDescription = content.hero.description?.trim();
  const heroEyebrow = content.hero.eyebrow?.trim();

  const storyTitle = content.story.title?.trim();
  const storyEyebrow = content.story.eyebrow?.trim();
  const storyParagraphs = content.story.paragraphs.filter(
    (paragraph) => paragraph.trim().length > 0,
  );

  const hasValues = sortedValues.length > 0;
  const hasStatistics = sortedStatistics.length > 0;
  const hasGallery = sortedGalleryImages.length > 0;

  return (
    <SiteChrome>
      <main>
        <section
          className="page-hero page-hero--editorial"
          aria-labelledby="about-page-title"
        >
          <div className="site-container page-hero__grid">
            <div className="page-hero__content">
              {heroEyebrow && (
                <span className="eyebrow">{heroEyebrow}</span>
              )}

              <h1 id="about-page-title">{heroTitle}</h1>

              {heroDescription && <p>{heroDescription}</p>}
            </div>

            <div
              className="page-hero__visual"
              aria-label="Uğur Bey Spot hakkında görsel"
            >
              {content.hero.image?.url ? (
                <ImageWithFallback
                  src={content.hero.image.url}
                  alt={
                    content.hero.image.alt?.trim() ||
                    `${heroTitle} hakkında görsel`
                  }
                  loading="eager"
                  fallback={
                    <div className="editorial-mark" aria-hidden="true">
                      <span>UB</span>
                      <small>UĞUR BEY SPOT</small>
                    </div>
                  }
                />
              ) : (
                <div className="editorial-mark" aria-hidden="true">
                  <span>UB</span>
                  <small>UĞUR BEY SPOT</small>
                </div>
              )}
            </div>
          </div>
        </section>

        {(storyTitle || storyParagraphs.length > 0) && (
          <section
            className="section"
            aria-labelledby="about-story-title"
          >
            <div className="site-container story-grid">
              <div className="story-grid__visual">
                {content.story.image?.url ? (
                  <ImageWithFallback
                    src={content.story.image.url}
                    alt={
                      content.story.image.alt?.trim() ||
                      storyTitle ||
                      "Uğur Bey Spot mağaza hikâyesi"
                    }
                    fallback={
                      <div
                        className="story-grid__placeholder"
                        aria-hidden="true"
                      >
                        <Icon name="store" size={40} />
                        <span>Mağaza hikâyesi</span>
                      </div>
                    }
                  />
                ) : (
                  <div
                    className="story-grid__placeholder"
                    aria-hidden="true"
                  >
                    <Icon name="store" size={40} />
                    <span>Mağaza hikâyesi</span>
                  </div>
                )}
              </div>

              <div className="story-grid__content">
                {storyEyebrow && (
                  <span className="eyebrow">{storyEyebrow}</span>
                )}

                {storyTitle && (
                  <h2 id="about-story-title">{storyTitle}</h2>
                )}

                {storyParagraphs.length > 0 && (
                  <div className="rich-paragraphs">
                    {storyParagraphs.map((paragraph, index) => (
                      <p key={`story-paragraph-${index}`}>
                        {paragraph.trim()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {hasValues && (
          <section
            className="section section--soft"
            aria-labelledby="about-values-title"
          >
            <div className="site-container">
              <div className="section-heading">
                <div>
                  {content.values.eyebrow?.trim() && (
                    <span className="eyebrow">
                      {content.values.eyebrow}
                    </span>
                  )}

                  <h2 id="about-values-title">{content.values.title}</h2>
                </div>

                {content.values.description?.trim() && (
                  <p>{content.values.description}</p>
                )}
              </div>

              <div className="values-grid">
                {sortedValues.map((item, index) => (
                  <article className="value-card" key={item.id}>
                    <div
                      className="value-card__number"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <span
                      className="value-card__icon"
                      aria-hidden="true"
                    >
                      <Icon name={item.icon} size={25} />
                    </span>

                    <h3>{item.title}</h3>

                    {item.description?.trim() && (
                      <p>{item.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasStatistics && (
          <section
            className="section section--dark"
            aria-labelledby="about-statistics-title"
          >
            <div className="site-container">
              <div className="section-heading section-heading--dark">
                <div>
                  {content.statistics.eyebrow?.trim() && (
                    <span className="eyebrow eyebrow--light">
                      {content.statistics.eyebrow}
                    </span>
                  )}

                  <h2 id="about-statistics-title">
                    {content.statistics.title}
                  </h2>
                </div>
              </div>

              <div className="statistics-grid">
                {sortedStatistics.map((item) => (
                  <article key={item.id}>
                    <strong>
                      {Number(item.value).toLocaleString("tr-TR")}
                      {item.suffix}
                    </strong>

                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasGallery && (
          <section
            className="section"
            aria-labelledby="about-gallery-title"
          >
            <div className="site-container">
              <div className="section-heading">
                <div>
                  {content.gallery.eyebrow?.trim() && (
                    <span className="eyebrow">
                      {content.gallery.eyebrow}
                    </span>
                  )}

                  <h2 id="about-gallery-title">
                    {content.gallery.title}
                  </h2>
                </div>

                {content.gallery.description?.trim() && (
                  <p>{content.gallery.description}</p>
                )}
              </div>

              <div className="about-gallery">
                {sortedGalleryImages.map((image, index) => (
                  <figure key={image.id}>
                    <ImageWithFallback
                      src={image.url}
                      alt={
                        image.alt?.trim() ||
                        `Uğur Bey Spot galeri görseli ${index + 1}`
                      }
                      fallback={
                        <div
                          className="story-grid__placeholder"
                          aria-hidden="true"
                        >
                          <Icon name="image" size={32} />
                          <span>Görsel yüklenemedi</span>
                        </div>
                      }
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </SiteChrome>
  );
}
