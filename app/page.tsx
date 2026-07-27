import type { Metadata } from "next";

import HomePageClient, {
  type HomeData,
} from "@/components/home/home-page-client";
import { getBanners } from "@/lib/banners";
import { getCategories } from "@/lib/categories";
import { DEFAULT_PAGE_SEO, SITE } from "@/lib/constants";
import { getFeaturedProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site-url";
import { getHomepageContent } from "@/lib/site-content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: DEFAULT_PAGE_SEO.home.title },
  description: DEFAULT_PAGE_SEO.home.description,
  keywords: DEFAULT_PAGE_SEO.home.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: DEFAULT_PAGE_SEO.home.title,
    description: DEFAULT_PAGE_SEO.home.description,
    siteName: SITE.name,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_PAGE_SEO.home.title,
    description: DEFAULT_PAGE_SEO.home.description,
  },
};

const faqItems = [
  {
    question: "Konya'da spot eşya nereden alınır?",
    answer:
      "Uğur Bey Spot'ta ikinci el mobilya, beyaz eşya, elektronik ve ev yaşam ürünlerini mağaza iletişimiyle inceleyebilirsiniz.",
  },
  {
    question: "İkinci el eşya satışı nasıl yapılır?",
    answer:
      "Satmak istediğiniz ürünün fotoğraflarını, marka-model bilgisini, çalışma durumunu ve konumunu ileterek ön değerlendirme talep edebilirsiniz.",
  },
  {
    question: "Spot eşya nedir?",
    answer:
      "Spot eşya; teşhir, fazla stok, kutusu açılmış ya da ikinci el durumdaki ürünlerin uygun fiyatlarla satışa sunulduğu ürün grubudur.",
  },
  {
    question: "Konya'da ikinci el beyaz eşya bulunur mu?",
    answer:
      "Ürün stoğuna bağlı olarak buzdolabı, çamaşır makinesi, bulaşık makinesi ve farklı beyaz eşya seçenekleri listelenebilir.",
  },
];

async function getInitialHomeData(): Promise<HomeData | undefined> {
  try {
    const [content, categories, products, banners] = await Promise.all([
      getHomepageContent(),
      getCategories(),
      getFeaturedProducts(),
      getBanners(),
    ]);

    return {
      content,
      categories,
      products,
      banners,
    };
  } catch (error) {
    console.error("Homepage initial SEO data could not be loaded:", error);
    return undefined;
  }
}

export default async function HomePage() {
  const initialData = await getInitialHomeData();

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: DEFAULT_PAGE_SEO.home.title,
        description: DEFAULT_PAGE_SEO.home.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#business` },
        inLanguage: "tr-TR",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c"),
        }}
      />

      <HomePageClient initialData={initialData} />
    </>
  );
}
