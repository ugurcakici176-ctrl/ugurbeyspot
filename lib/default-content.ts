import { DEFAULT_PAGE_SEO } from "@/lib/constants";
import type {
  AboutContent,
  HomepageContent,
  SiteSettings,
} from "@/lib/types";

const EMPTY_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export const DEFAULT_HERO_IMAGES = [
  {
    id: "spot-magaza-vitrini",
    url: "/images/spot/konya-ikinci-el-esya-magazasi.jpg",
    storagePath: "",
    alt: "Konya Uğur Bey Spot ikinci el mobilya ve beyaz eşya mağazası",
    width: 1536,
    height: 1024,
    sortOrder: 1,
  },
  {
    id: "ikinci-el-koltuk",
    url: "/images/spot/ikinci-el-koltuk.jpg",
    storagePath: "",
    alt: "Konya'da satışa sunulan temiz ikinci el koltuk",
    width: 1254,
    height: 1254,
    sortOrder: 2,
  },
  {
    id: "ikinci-el-beyaz-esya",
    url: "/images/spot/ikinci-el-beyaz-esya.jpg",
    storagePath: "",
    alt: "İkinci el buzdolabı çamaşır makinesi ve televizyon",
    width: 1254,
    height: 1254,
    sortOrder: 3,
  },
];

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    eyebrow: "UĞUR BEY SPOT",
    title: "Konya'da İkinci El Eşya.",
    highlightedText: "Doğru Ürün, Doğru Fiyat.",
    description:
      "İkinci el mobilya, beyaz eşya, elektronik ve ev eşyalarında güncel seçenekleri keşfedin; eşyanızı satmak için hızlı teklif alın.",
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
    images: DEFAULT_HERO_IMAGES,
    status: "active",
  },
  trustItems: [
    {
      id: "genis-urun",
      title: "Seçilmiş İkinci El Ürünler",
      description: "Mobilyadan beyaz eşyaya güncel ürün seçenekleri.",
      icon: "package",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "avantajli-fiyat",
      title: "Konya'da Avantajlı Fiyat",
      description: "Bütçenize uygun ikinci el ve spot alternatifleri.",
      icon: "badge-percent",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "guvenilir-alisveris",
      title: "Güvenilir Alışveriş",
      description: "Konya'da gerçek mağaza, doğrudan iletişim ve şeffaf süreç.",
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
      "İkinci el mobilya, beyaz eşya, elektronik ve ev ürünlerine kategorilerden hızla ulaşın.",
  },
  featuredProductsSection: {
    eyebrow: "SEÇKİ",
    title: "Öne Çıkan Ürünler",
    description:
      "Konya mağazamızda satışta olan öne çıkan ikinci el ve spot ürünleri keşfedin.",
  },
  campaignSection: {
    eyebrow: "FIRSATLAR",
    title: "Güncel Seçenekleri Kaçırmayın",
  },
  whyUsSection: {
    eyebrow: "NEDEN BİZ?",
    title: "Alışverişte Daha Net, Daha Ulaşılabilir Bir Deneyim",
    description:
      "İkinci el eşya alım satımında ürün çeşitliliğini hızlı iletişim ve Konya mağaza güveniyle bir araya getiriyoruz.",
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
    title: "Konya'da Ziyaret Edebileceğiniz Gerçek Bir Spot Mağaza",
    description:
      "İkinci el ürünlerimizi inceleyin, güncel stok bilgisi alın ve Konya'daki mağazamıza gelerek seçenekleri yakından görün.",
    address: "",
    workingHoursText: "",
    image: DEFAULT_HERO_IMAGES[0],
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
    title: "İkinci El Eşya Almak veya Satmak İçin Bize Yazın",
    description:
      "Konya'da ikinci el eşyanız için teklif almak veya güncel ürünleri sormak üzere bizimle doğrudan iletişime geçin.",
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
    image: {
      id: "ugurbey-spot-magaza-ic-gorunus",
      url: "/images/store/ugurbey-spot-magaza-ic-gorunus.jpg",
      storagePath: "",
      alt: "Uğur Bey Spot ikinci el mobilya ve beyaz eşya mağazası iç görünüşü",
      width: 1774,
      height: 887,
      sortOrder: 1,
    },
  },

  story: {
    eyebrow: "BİZİM HİKÂYEMİZ",
    title: "Konya'da Güvenilir İkinci El Alışveriş İçin",
    paragraphs: [
      "Müşterilerimizin ikinci el mobilya, beyaz eşya ve elektronik ihtiyaçlarına uygun ürünleri tek noktada bulabilmesini önemsiyoruz.",
      "Konya'daki mağazamızda ürün çeşitliliği kadar hızlı iletişim, şeffaf bilgi ve ulaşılabilir hizmet anlayışını da merkezde tutuyoruz.",
    ],
    image: {
      id: "ugurbey-konya-magaza-dis-gorunus",
      url: "/images/store/ugurbey-spot-konya-magaza-dis-gorunus.jpg",
      storagePath: "",
      alt: "Konya Uğur Bey Spot mağazasının dış görünüşü",
      width: 1448,
      height: 1086,
      sortOrder: 1,
    },
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
  items: [
    {
      id: "yillik-deneyim",
      value: 10,
      suffix: "+",
      label: "Yıllık Deneyim",
      sortOrder: 1,
    },
    {
      id: "urun-secenegi",
      value: 500,
      suffix: "+",
      label: "Ürün Seçeneği",
      sortOrder: 2,
    },
    {
      id: "mutlu-musteri",
      value: 2500,
      suffix: "+",
      label: "Mutlu Müşteri",
      sortOrder: 3,
    },
    {
      id: "urun-kategorisi",
      value: 20,
      suffix: "+",
      label: "Ürün Kategorisi",
      sortOrder: 4,
    },
  ],
},

  gallery: {
    eyebrow: "MAĞAZAMIZ",
    title: "Bizi Yakından Tanıyın",
    description:
      "Mağazamızdan kareleri ve ürün alanlarımızı keşfedin.",
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
