"use client";

import { useEffect, useState } from "react";

import SiteChrome from "@/components/site/site-chrome";
import EmptyState from "@/components/ui/empty-state";
import Icon from "@/components/ui/icon";
import LoadingScreen from "@/components/ui/loading-screen";
import { getAboutContent } from "@/lib/site-content";
import type { AboutContent } from "@/lib/types";

export default function AboutPageClient() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getAboutContent()
      .then((data) => {
        if (active) setContent(data);
      })
      .catch((reason: unknown) => {
        console.error("About content could not be loaded:", reason);
        if (active) setError("Hakkımızda içeriği şu anda yüklenemedi.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!content && !error) {
    return <LoadingScreen label="Hikâyemiz hazırlanıyor" />;
  }

  if (!content) {
    return (
      <SiteChrome>
        <section className="page-shell">
          <div className="site-container">
            <EmptyState
              title="İçerik görüntülenemiyor"
              description={error || "Lütfen tekrar deneyin."}
            />
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <section className="page-hero page-hero--editorial">
        <div className="site-container page-hero__grid">
          <div>
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.description}</p>
          </div>

          <div className="page-hero__visual">
            {content.hero.image ? (
              <img
                src={content.hero.image.url}
                alt={content.hero.image.alt || content.hero.title}
              />
            ) : (
              <div className="editorial-mark">
                <span>UB</span>
                <small>UĞUR BEY SPOT</small>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="site-container story-grid">
          <div className="story-grid__visual">
            {content.story.image ? (
              <img
                src={content.story.image.url}
                alt={content.story.image.alt || content.story.title}
              />
            ) : (
              <div className="story-grid__placeholder">
                <Icon name="store" size={40} />
                <span>Mağaza hikâyesi</span>
              </div>
            )}
          </div>

          <div className="story-grid__content">
            <span className="eyebrow">{content.story.eyebrow}</span>
            <h2>{content.story.title}</h2>
            <div className="rich-paragraphs">
              {content.story.paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{content.values.eyebrow}</span>
              <h2>{content.values.title}</h2>
            </div>
            <p>{content.values.description}</p>
          </div>

          <div className="values-grid">
            {[...content.values.items]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item, index) => (
                <article className="value-card" key={item.id}>
                  <div className="value-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span className="value-card__icon">
                    <Icon name={item.icon} size={25} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
          </div>
        </div>
      </section>

      {content.statistics.items.length > 0 && (
        <section className="section section--dark">
          <div className="site-container">
            <div className="section-heading section-heading--dark">
              <div>
                <span className="eyebrow eyebrow--light">
                  {content.statistics.eyebrow}
                </span>
                <h2>{content.statistics.title}</h2>
              </div>
            </div>

            <div className="statistics-grid">
              {[...content.statistics.items]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => (
                  <article key={item.id}>
                    <strong>
                      {item.value.toLocaleString("tr-TR")}
                      {item.suffix}
                    </strong>
                    <span>{item.label}</span>
                  </article>
                ))}
            </div>
          </div>
        </section>
      )}

      {content.gallery.images.length > 0 && (
        <section className="section">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{content.gallery.eyebrow}</span>
                <h2>{content.gallery.title}</h2>
              </div>
              <p>{content.gallery.description}</p>
            </div>

            <div className="about-gallery">
              {[...content.gallery.images]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((image) => (
                  <figure key={image.id}>
                    <img src={image.url} alt={image.alt} loading="lazy" />
                  </figure>
                ))}
            </div>
          </div>
        </section>
      )}
    </SiteChrome>
  );
}
