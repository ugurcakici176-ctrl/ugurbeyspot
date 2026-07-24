import type { Metadata } from "next";
import Link from "next/link";

import SiteChrome from "@/components/site/site-chrome";
import { BRAND_ASSETS } from "@/lib/branding";
import { SITE } from "@/lib/constants";
import { SITE_URL } from "@/lib/site-url";

import styles from "./page.module.css";

const PAGE_PATH = "/konya-spot";
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: {
    absolute: "Konya Spot ve İkinci El Eşya Mağazası | Uğur Bey Spot",
  },
  description:
    "Konya'da ikinci el mobilya, beyaz eşya, elektronik ve spot ev eşyalarını Uğur Bey Spot'ta keşfedin. Güncel ürünler ve hızlı iletişim.",
  keywords: [
    "Konya spot",
    "Konya spotçu",
    "Konya spot eşya",
    "Konya ikinci el eşya",
    "Konya ikinci el mobilya",
    "Konya ikinci el beyaz eşya",
    "Konya spot mağaza",
    "Konya ikinci el elektronik",
  ],
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: PAGE_URL,
    siteName: SITE.name,
    title: "Konya Spot ve İkinci El Eşya Mağazası | Uğur Bey Spot",
    description:
      "Konya'da güncel spot ve ikinci el mobilya, beyaz eşya, elektronik ürün seçeneklerini inceleyin.",
    images: [
      {
        url: BRAND_ASSETS.social,
        width: 1200,
        height: 630,
        alt: "Uğur Bey Spot Konya spot ve ikinci el eşya mağazası",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konya Spot ve İkinci El Eşya | Uğur Bey Spot",
    description:
      "Konya'da ikinci el mobilya, beyaz eşya, elektronik ve spot ürün seçenekleri.",
    images: [BRAND_ASSETS.social],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const categories = [
  {
    title: "İkinci El Mobilya",
    description:
      "Koltuk takımı, masa, sandalye, dolap ve ev yaşam ürünlerini inceleyin.",
    href: "/urunler",
  },
  {
    title: "İkinci El Beyaz Eşya",
    description:
      "Buzdolabı, çamaşır makinesi ve farklı beyaz eşya seçeneklerini keşfedin.",
    href: "/urunler",
  },
  {
    title: "Spot Elektronik",
    description:
      "Televizyon ve farklı elektronik ürün seçeneklerine göz atın.",
    href: "/urunler",
  },
  {
    title: "Ev Yaşam Ürünleri",
    description:
      "Evinizin ihtiyaçlarına uygun, avantajlı ve güncel ürünleri bulun.",
    href: "/urunler",
  },
] as const;

const faqItems = [
  {
    question: "Konya'da spot eşya nereden alınır?",
    answer:
      "Uğur Bey Spot'un güncel ürünlerini internet sitesinden inceleyebilir, ürün detayları ve mağaza bilgileri için doğrudan iletişime geçebilirsiniz.",
  },
  {
    question: "Spot eşya ile ikinci el eşya aynı şey mi?",
    answer:
      "Her zaman aynı değildir. Spot ürünler teşhir, stok fazlası veya farklı ticari nedenlerle avantajlı sunulabilir. İkinci el ürünler ise daha önce kullanılmış olabilir. Ürünün durumu, açıklamasında açıkça belirtilmelidir.",
  },
  {
    question: "Konya'da ikinci el eşya satmak için nasıl iletişime geçebilirim?",
    answer:
      "İletişim sayfasındaki kanallardan ürünün fotoğraflarını, markasını, modelini ve mevcut durumunu göndererek değerlendirme talep edebilirsiniz.",
  },
  {
    question: "Ürünlerin teslimat durumu nasıl öğrenilir?",
    answer:
      "Teslimat kapsamı; ürünün ölçüsüne, teslimat adresine ve güncel mağaza planına göre değişebilir. Sipariş öncesinde mağazadan net bilgi almanız önerilir.",
  },
] as const;

export default function KonyaSpotPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}/#webpage`,
        url: PAGE_URL,
        name: "Konya Spot ve İkinci El Eşya Mağazası",
        description:
          "Konya'da spot ve ikinci el mobilya, beyaz eşya, elektronik ve ev yaşam ürünleri.",
        inLanguage: "tr-TR",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": `${SITE_URL}/#business`,
        },
        breadcrumb: {
          "@id": `${PAGE_URL}/#breadcrumb`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${PAGE_URL}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Ana Sayfa",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Konya Spot",
            item: PAGE_URL,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
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
              <span>Konya Spot</span>
            </nav>

            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.eyebrow}>UĞUR BEY SPOT • KONYA</span>

                <h1>
                  Konya Spot ve
                  <span> İkinci El Eşya Mağazası</span>
                </h1>

                <p className={styles.lead}>
                  Konya&apos;da ikinci el mobilya, beyaz eşya, elektronik ve
                  ev yaşam ürünlerini tek noktada keşfedin. Güncel ürünleri
                  inceleyin, ürün detaylarını sorun ve mağazayla hızlıca
                  iletişime geçin.
                </p>

                <div className={styles.actions}>
                  <Link className={styles.primaryButton} href="/urunler">
                    Güncel Ürünleri İncele
                    <span aria-hidden="true">→</span>
                  </Link>

                  <Link className={styles.secondaryButton} href="/iletisim">
                    Mağazaya Ulaş
                  </Link>
                </div>

                <ul className={styles.heroBenefits} aria-label="Hizmet avantajları">
                  <li>Güncel ürün seçenekleri</li>
                  <li>Mağazadan hızlı bilgi</li>
                  <li>Konya odaklı hizmet</li>
                </ul>
              </div>

              <aside className={styles.heroCard}>
                <span className={styles.cardLabel}>KONYA&apos;DA ARADIĞINIZ</span>
                <strong>Spot ve ikinci el ürünler</strong>
                <p>
                  Mobilyadan beyaz eşyaya, elektronikten ev yaşam ürünlerine
                  kadar farklı kategorileri inceleyin.
                </p>

                <div className={styles.cardStats}>
                  <div>
                    <strong>4+</strong>
                    <span>Ana kategori</span>
                  </div>
                  <div>
                    <strong>Hızlı</strong>
                    <span>Mağaza iletişimi</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>ÜRÜN KATEGORİLERİ</span>
                <h2>Konya&apos;da spot ve ikinci el eşya seçenekleri</h2>
              </div>
              <p>
                İhtiyacınıza uygun ürün grubunu seçin. Güncel stok ve ürün
                durumu için ilgili ürün sayfasını inceleyin veya mağazaya ulaşın.
              </p>
            </header>

            <div className={styles.categoryGrid}>
              {categories.map((category, index) => (
                <Link
                  className={styles.categoryCard}
                  href={category.href}
                  key={category.title}
                >
                  <span className={styles.categoryNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <span className={styles.cardLink}>
                    Ürünleri keşfet <span aria-hidden="true">↗</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.softSection}`}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <article className={styles.copy}>
                <span className={styles.eyebrow}>KONYA SPOT MAĞAZASI</span>
                <h2>İhtiyacınıza uygun ürünü daha kolay bulun</h2>

                <p>
                  Uğur Bey Spot, Konya&apos;da evini yenilemek, eksiklerini
                  tamamlamak veya avantajlı ürün seçeneklerini değerlendirmek
                  isteyen kullanıcılar için güncel ürünleri bir araya getirir.
                </p>

                <p>
                  Ürünlerin marka, model, ölçü, kondisyon ve stok bilgileri
                  zamanla değişebilir. Bu nedenle karar vermeden önce ürün
                  detaylarını incelemeniz ve mağazadan güncel bilgi almanız
                  önemlidir.
                </p>

                <h3>Konya ikinci el eşya alırken nelere dikkat edilmeli?</h3>

                <ul className={styles.checkList}>
                  <li>Ürünün genel durumunu ve çalışan parçalarını kontrol edin.</li>
                  <li>Ölçülerin kullanılacağı alana uygun olduğundan emin olun.</li>
                  <li>Teslimat ve taşıma koşullarını önceden netleştirin.</li>
                  <li>Ürün açıklamasında belirtilen kondisyon bilgisini okuyun.</li>
                </ul>
              </article>

              <aside className={styles.infoPanel}>
                <span className={styles.eyebrow}>HIZLI ERİŞİM</span>
                <h2>Aradığınız ürünü bize anlatın</h2>
                <p>
                  Ürün türünü, yaklaşık ölçüyü ve bütçe aralığını paylaşın.
                  Mağazadaki güncel seçenekler hakkında bilgi alın.
                </p>

                <div className={styles.infoLinks}>
                  <Link href="/urunler">
                    <span>Güncel ürünler</span>
                    <strong>İncele →</strong>
                  </Link>
                  <Link href="/iletisim">
                    <span>Mağaza iletişimi</span>
                    <strong>Ulaş →</strong>
                  </Link>
                  <Link href="/hakkimizda">
                    <span>Uğur Bey Spot</span>
                    <strong>Tanıyın →</strong>
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
              <h2>Konya spot eşya hakkında merak edilenler</h2>
              <p>
                Spot ve ikinci el ürün alışverişi öncesinde en sık sorulan
                soruların kısa cevapları.
              </p>
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
                <span className={styles.eyebrow}>UĞUR BEY SPOT</span>
                <h2>Konya&apos;daki güncel ürünleri keşfedin</h2>
                <p>
                  Ürünleri inceleyin veya aradığınız ürün hakkında mağazadan
                  hızlıca bilgi alın.
                </p>
              </div>

              <div className={styles.actions}>
                <Link className={styles.lightButton} href="/urunler">
                  Ürünleri İncele
                </Link>
                <Link className={styles.outlineButton} href="/iletisim">
                  İletişime Geç
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
