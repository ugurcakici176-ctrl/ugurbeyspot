import { DEFAULT_PAGE_SEO } from "@/lib/constants";
import type {
  AboutContent,
  HomepageContent,
  SiteSettings,
} from "@/lib/types";

const EMPTY_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    eyebrow: "UĞUR BEY SPOT",
    title: "Eviniz İçin Doğru Ürün.",
    highlightedText: "Doğru Fiyat.",
    description:
      "Elektronikten ev yaşam ürünlerine, ihtiyacınız olan ürünleri avantajlı seçeneklerle keşfedin.",
    primaryButton: {
      label: "Ürünleri Keşfet",
      href: "/urunler",
      target: "_self",
    },
    secondaryButton: {
      label: "Bize Ulaşın",
      href: "/iletisim",
      target: "_self",
    },
    images: [],
    status: "active",
  },
  trustItems: [
    {
      id: "genis-urun",
      title: "Geniş Ürün Yelpazesi",
      description: "Farklı ihtiyaçlara uygun ürün seçenekleri.",
      icon: "package",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "avantajli-fiyat",
      title: "Avantajlı Fiyatlar",
      description: "Fiyat ve performans odaklı ürün alternatifleri.",
      icon: "badge-percent",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "guvenilir-alisveris",
      title: "Güvenilir Alışveriş",
      description: "Gerçek mağaza, doğrudan iletişim ve şeffaf süreç.",
      icon: "shield-check",
      sortOrder: 3,
      status: "active",
    },
    {
      id: "hizli-iletisim",
      title: "Hızlı İletişim",
      description: "Ürünler hakkında kolayca bilgi alın.",
      icon: "message-circle",
      sortOrder: 4,
      status: "active",
    },
  ],
  categoriesSection: {
    eyebrow: "KATEGORİLER",
    title: "İhtiyacınıza Göre Keşfedin",
    description:
      "Aradığınız ürüne daha hızlı ulaşmak için kategorilerimizi inceleyin.",
  },
  featuredProductsSection: {
    eyebrow: "SEÇKİ",
    title: "Öne Çıkan Ürünler",
    description:
      "Mağazamızda öne çıkan ürünleri ve güncel seçenekleri keşfedin.",
  },
  campaignSection: {
    eyebrow: "FIRSATLAR",
    title: "Güncel Seçenekleri Kaçırmayın",
  },
  whyUsSection: {
    eyebrow: "NEDEN BİZ?",
    title: "Alışverişte Daha Net, Daha Ulaşılabilir Bir Deneyim",
    description:
      "Ürün çeşitliliğini hızlı iletişim ve mağaza güveniyle bir araya getiriyoruz.",
    items: [
      {
        id: "urun-secimi",
        title: "Ürün Seçeneği",
        description: "Farklı ihtiyaçlara hitap eden geniş ürün grupları.",
        icon: "layers",
        sortOrder: 1,
        status: "active",
      },
      {
        id: "dogrudan-iletisim",
        title: "Doğrudan İletişim",
        description: "Ürün hakkında hızlıca bilgi alabileceğiniz iletişim.",
        icon: "phone",
        sortOrder: 2,
        status: "active",
      },
      {
        id: "magaza-guveni",
        title: "Mağaza Güveni",
        description: "Gerçek mağaza deneyimi ve ulaşılabilir hizmet.",
        icon: "store",
        sortOrder: 3,
        status: "active",
      },
    ],
  },
  storeSection: {
    eyebrow: "MAĞAZAMIZ",
    title: "Sadece Bir Web Sitesi Değil, Gerçek Bir Mağaza",
    description:
      "Ürünlerimizi inceleyin, detaylı bilgi alın ve mağazamıza gelerek seçenekleri yakından görün.",
    address: "",
    workingHoursText: "",
    directionsButton: {
      label: "Yol Tarifi Al",
      href: "/iletisim",
      target: "_self",
    },
    status: "active",
  },
  socialSection: {
    eyebrow: "SOSYAL MEDYA",
    title: "Bizi Sosyal Medyada Takip Edin",
    description:
      "Yeni ürünleri ve mağazamızdan güncel paylaşımları takip edin.",
    gallery: [],
    status: "active",
  },
  finalCta: {
    eyebrow: "HIZLI İLETİŞİM",
    title: "Aradığınız Ürün İçin Bize Yazın",
    description:
      "Ürün bilgisi ve güncel seçenekler için ekibimizle doğrudan iletişime geçin.",
    primaryButton: {
      label: "WhatsApp'tan Sor",
      href: "/iletisim",
      target: "_self",
    },
    secondaryButton: {
      label: "Bizi Arayın",
      href: "/iletisim",
      target: "_self",
    },
    status: "active",
  },
  updatedAt: EMPTY_UPDATED_AT,
};

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    eyebrow: "HAKKIMIZDA",
    title: "İhtiyacınız Olan Ürünü, Doğru Seçenekle Buluşturuyoruz.",
    description:
      "Uğur Bey Spot olarak ürün çeşitliliğini, ulaşılabilir iletişimi ve mağaza güvenini tek noktada sunuyoruz.",
  },
  story: {
    eyebrow: "BİZİM HİKÂYEMİZ",
    title: "Alışverişi Daha Kolay ve Daha Ulaşılabilir Hale Getirmek İçin",
    paragraphs: [
      "Müşterilerimizin farklı ihtiyaçlarına uygun ürünleri tek noktada bulabilmesini önemsiyoruz.",
      "Mağazamızda ürün çeşitliliği kadar hızlı iletişim, şeffaf bilgi ve ulaşılabilir hizmet anlayışını da merkezde tutuyoruz.",
    ],
  },
  values: {
    eyebrow: "DEĞERLERİMİZ",
    title: "Her Temasta Aynı Yaklaşım",
    description:
      "İşimizi günlük satışın ötesinde, uzun vadeli güven ilişkisi olarak görüyoruz.",
    items: [
      {
        id: "guven",
        title: "Güven",
        description: "Açık iletişim ve ulaşılabilir mağaza anlayışı.",
        icon: "shield-check",
        sortOrder: 1,
      },
      {
        id: "ulasilebilirlik",
        title: "Ulaşılabilirlik",
        description: "Sorularınıza hızlı ve doğrudan yanıt.",
        icon: "message-circle",
        sortOrder: 2,
      },
      {
        id: "urun-cesitliligi",
        title: "Ürün Çeşitliliği",
        description: "Farklı ihtiyaçlara yönelik geniş seçenekler.",
        icon: "package",
        sortOrder: 3,
      },
      {
        id: "musteri-memnuniyeti",
        title: "Müşteri Memnuniyeti",
        description: "Süreç boyunca anlaşılır ve çözüm odaklı yaklaşım.",
        icon: "heart-handshake",
        sortOrder: 4,
      },
    ],
  },
  statistics: {
    eyebrow: "RAKAMLARLA BİZ",
    title: "Gerçek Verilerle Büyüyen Bir Mağaza",
    items: [],
  },
  gallery: {
    eyebrow: "MAĞAZAMIZ",
    title: "Bizi Yakından Tanıyın",
    description: "Mağazamızdan kareleri ve ürün alanlarımızı keşfedin.",
    images: [],
  },
  seo: DEFAULT_PAGE_SEO.about,
  updatedAt: EMPTY_UPDATED_AT,
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  branding: {
    siteName: "Uğur Bey Spot",
    shortName: "Uğur Bey Spot",
    slogan: "Doğru ürün. Doğru fiyat.",
  },
  header: {
    navLabels: {
      home: "Ana Sayfa",
      about: "Hakkımızda",
      products: "Ürünler",
      contact: "İletişim",
    },
    primaryCtaLabel: "Hızlı Teklif",
    primaryCtaHref: "/iletisim",
    showAuthButtons: true,
  },
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    district: "",
    googleMapsUrl: "",
    socialLinks: [],
    workingHours: [],
    updatedAt: EMPTY_UPDATED_AT,
  },
  seo: {
    defaultSeo: DEFAULT_PAGE_SEO.home,
    homepageSeo: DEFAULT_PAGE_SEO.home,
    aboutSeo: DEFAULT_PAGE_SEO.about,
    productsSeo: DEFAULT_PAGE_SEO.products,
    contactSeo: DEFAULT_PAGE_SEO.contact,
  },
  announcement: {
    text: "",
    status: "passive",
  },
  footer: {
    quickLinksTitle: "Sayfalar",
    contactTitle: "İletişim",
    storeTitle: "Mağaza",
    description:
      "Elektronikten ev yaşam ürünlerine, farklı ihtiyaçlara yönelik ürün seçenekleri.",
    copyrightText: "Uğur Bey Spot. Tüm hakları saklıdır.",
    bottomNote: "Uğur Bey Spot dijital mağaza deneyimi.",
    legalLinks: [
      {
        id: "kvkk",
        label: "KVKK",
        href: "/kvkk-aydinlatma-metni",
      },
      {
        id: "gizlilik",
        label: "Gizlilik",
        href: "/gizlilik-politikasi",
      },
      {
        id: "kullanim-kosullari",
        label: "Kullanım Koşulları",
        href: "/kullanim-kosullari",
      },
    ],
  },
  updatedAt: EMPTY_UPDATED_AT,
};
