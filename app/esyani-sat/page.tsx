import type { Metadata } from "next";
import Link from "next/link";

import SiteChrome from "@/components/site/site-chrome";
import SellCtaButton from "@/components/site/sell-cta-button";
import { DEFAULT_SITE_SETTINGS } from "@/lib/default-content";
import { pageOpenGraph, pageTwitter } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { buildTelUrl, buildWhatsappUrl } from "@/lib/utils";

import styles from "../konya-spot/page.module.css";

const PAGE_PATH = "/esyani-sat";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;
const TITLE = "Konya'da Eşyanızı Değerinde Alalım | Uğur Bey Spot";
const DESCRIPTION =
  "Konya'da ikinci el beyaz eşya, mobilya, koltuk ve elektroniğinizi satın. Fotoğraf gönderin, ücretsiz teklif alın. Ev boşaltma ve toplu eşya alımı için Uğur Bey Spot.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "Konya eşya alanlar",
    "Konya spotçu",
    "Konya ikinci el eşya alan",
    "Konya beyaz eşya alan",
    "Konya mobilya alan",
    "Konya ev boşaltma",
    "eşyamı satmak istiyorum Konya",
    "Karatay spotçu",
  ],
  alternates: { canonical: PAGE_PATH },
  openGraph: pageOpenGraph({ url: PAGE_PATH, title: TITLE, description: DESCRIPTION }),
  twitter: pageTwitter({ title: TITLE, description: DESCRIPTION }),
};

const steps = [
  {
    title: "Fotoğrafları gönderin",
    description:
      "Eşyanızın birkaç net fotoğrafını, marka-model bilgisini ve kısa bir açıklamayı formdan ya da WhatsApp'tan iletin.",
  },
  {
    title: "Teklifimizi alın",
    description:
      "Ürünün durumuna, yaşına ve piyasa değerine göre değerlendirip size en kısa sürede teklifimizi iletelim.",
  },
  {
    title: "Anlaşınca teslim edin",
    description:
      "Teklif uygunsa teslim şeklini ve zamanını birlikte planlayalım; eşyanızı mağazaya getirin ya da teslim alma için bizimle görüşün.",
  },
] as const;

const buyCategories = [
  "Buzdolabı ve derin dondurucu",
  "Çamaşır ve bulaşık makinesi",
  "Fırın, ocak ve davlumbaz",
  "Koltuk takımı ve kanepe",
  "Yatak odası, baza ve gardırop",
  "Masa, sandalye ve vitrin",
  "Televizyon ve elektronik",
  "Klima ve küçük ev aletleri",
] as const;

const tips = [
  "Eşyayı gün ışığında, önden ve yanlardan çekin; varsa çizik ve hasarları da gösterin.",
  "Marka, model ve mümkünse ürünün etiket fotoğrafını ekleyin.",
  "Ürünün yaşını ve çalışma durumunu açıkça belirtin.",
  "Koltuk ve mobilyada yaklaşık ölçüleri yazın.",
] as const;

const faqItems = [
  {
    question: "Konya'da hangi ikinci el eşyaları alıyorsunuz?",
    answer:
      "Buzdolabı, çamaşır ve bulaşık makinesi, fırın, koltuk takımı, yatak odası, gardırop, masa-sandalye, televizyon, klima ve küçük ev aletleri gibi ev eşyalarını değerlendiriyoruz.",
  },
  {
    question: "Teklif almak ücretli mi?",
    answer:
      "Hayır. Fotoğraf ve bilgileri gönderip teklif almak ücretsizdir; teklifi kabul edip etmemek size kalmıştır.",
  },
  {
    question: "Teklifi ne kadar sürede alırım?",
    answer:
      "Gönderdiğiniz bilgiler incelendikten sonra en kısa sürede size dönüş yapıyoruz. Acil durumlarda telefon veya WhatsApp ile ulaşabilirsiniz.",
  },
  {
    question: "Ev boşaltma veya toplu eşya alımı yapıyor musunuz?",
    answer:
      "Taşınma, ev boşaltma veya iş yeri kapatma gibi durumlarda toplu eşya için de teklif veriyoruz. Detaylar için bizi arayın.",
  },
  {
    question: "Arızalı veya çalışmayan eşyaları alıyor musunuz?",
    answer:
      "Ürünün durumuna göre değerlendiriyoruz. Arızayı açıkça belirtirseniz size gerçekçi bir teklif verebiliriz.",
  },
] as const;

export default function SellItemsPage() {
  const contact = DEFAULT_SITE_SETTINGS.contact;
  const phoneUrl = buildTelUrl(contact.phone);
  const whatsappUrl = buildWhatsappUrl(
    contact.whatsapp,
    "Merhaba, satmak istediğim bir eşya var. Fotoğraflarını gönderiyorum.",
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${PAGE_URL}/#service`,
        name: "İkinci el eşya alımı",
        serviceType: "İkinci el eşya alımı ve ev boşaltma",
        description: DESCRIPTION,
        provider: { "@id": `${SITE_URL}/#business` },
        areaServed: { "@type": "City", name: "Konya" },
        url: PAGE_URL,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Eşyanı Sat", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <SiteChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Sayfa yolu">
              <Link href="/">Ana Sayfa</Link>
              <span aria-hidden="true">/</span>
              <span>Eşyanı Sat</span>
            </nav>

            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.eyebrow}>UĞUR BEY SPOT • EŞYA ALIMI</span>

                <h1>
                  Konya&apos;da Eşyanızı
                  <span> Değerinde Alalım</span>
                </h1>

                <p className={styles.lead}>
                  Kullanmadığınız beyaz eşya, mobilya, koltuk ve elektroniğinizin
                  fotoğraflarını gönderin, size ücretsiz teklif verelim. Taşınma
                  ve ev boşaltmada toplu alım da yapıyoruz.
                </p>

                <div className={styles.actions}>
                  <SellCtaButton className={styles.primaryButton}>
                    Fotoğraf Gönder, Teklif Al
                    <span aria-hidden="true">→</span>
                  </SellCtaButton>

                  {whatsappUrl && (
                    <a
                      className={styles.secondaryButton}
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp&apos;tan Gönder
                    </a>
                  )}
                </div>

                <ul className={styles.heroBenefits} aria-label="Avantajlar">
                  <li>Ücretsiz teklif</li>
                  <li>Hızlı değerlendirme</li>
                  <li>Toplu eşya alımı</li>
                </ul>
              </div>

              <aside className={styles.heroCard}>
                <span className={styles.cardLabel}>HEMEN ULAŞIN</span>
                <strong>{contact.phone}</strong>
                <p>
                  Eşyanızı anlatın, fotoğraf göndermeden önce de bilgi alın.
                  Pazartesi–Cumartesi 08:00–19:00.
                </p>

                <div className={styles.infoLinks}>
                  <a href={phoneUrl}>
                    <span>Telefonla arayın</span>
                    <strong>Ara →</strong>
                  </a>
                  <Link href="/iletisim">
                    <span>Mağaza adresi</span>
                    <strong>Yol tarifi →</strong>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>NASIL ÇALIŞIR?</span>
                <h2>3 adımda eşyanızı satın</h2>
              </div>
              <p>
                Mağazaya gelmeden önce fotoğraflarla ön değerlendirme yapıyoruz;
                böylece zamanınız boşa gitmiyor.
              </p>
            </header>

            <div className={styles.categoryGrid}>
              {steps.map((step, index) => (
                <article className={styles.categoryCard} key={step.title}>
                  <span className={styles.categoryNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <article className={styles.copy}>
                <span className={styles.eyebrow}>NELERİ ALIYORUZ?</span>
                <h2>Konya&apos;da ikinci el ev eşyası alımı</h2>

                <p>
                  Evini yenileyen, taşınan ya da kullanmadığı eşyalarını
                  değerlendirmek isteyenler için Uğur Bey Spot olarak ikinci el
                  ev eşyalarına teklif veriyoruz.
                </p>

                <ul className={styles.checkList}>
                  {buyCategories.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <h3>Daha doğru teklif için ipuçları</h3>

                <ul className={styles.checkList}>
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </article>

              <aside className={styles.infoPanel}>
                <span className={styles.eyebrow}>EV BOŞALTMA</span>
                <h2>Taşınma ve toplu eşya alımı</h2>
                <p>
                  Ev boşaltma, taşınma veya iş yeri kapatma durumlarında tüm
                  eşyalar için tek seferde teklif alın. Eşyaların listesini ya da
                  fotoğraflarını göndermeniz yeterli.
                </p>

                <div className={styles.infoLinks}>
                  <a href={phoneUrl}>
                    <span>Toplu alım için arayın</span>
                    <strong>{contact.phone}</strong>
                  </a>
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <span>WhatsApp&apos;tan liste gönderin</span>
                      <strong>Yaz →</strong>
                    </a>
                  )}
                  <Link href="/urunler">
                    <span>Satıştaki ürünler</span>
                    <strong>İncele →</strong>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.faqHeader}>
              <span className={styles.eyebrow}>SIKÇA SORULAN SORULAR</span>
              <h2>Eşya satarken merak edilenler</h2>
              <p>İkinci el eşyanızı satmadan önce en sık sorulan soruların cevapları.</p>
            </header>

            <div className={styles.faqList}>
              {faqItems.map((item, index) => (
                <details className={styles.faqItem} key={item.question}>
                  <summary>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item.question}
                    <i aria-hidden="true">+</i>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.cta}>
              <div>
                <span className={styles.eyebrow}>ÜCRETSİZ TEKLİF</span>
                <h2>Eşyanızın değerini öğrenin</h2>
                <p>Fotoğrafları gönderin, size en kısa sürede dönüş yapalım.</p>
              </div>

              <div className={styles.actions}>
                <SellCtaButton className={styles.lightButton}>
                  Teklif Al
                </SellCtaButton>
                <a className={styles.outlineButton} href={phoneUrl}>
                  Hemen Ara
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
