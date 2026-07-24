import type { SeoConfig } from "@/lib/types";

export const SITE = {
  name: "Uğur Bey Spot",
  shortName: "Uğur Bey Spot",
  locale: "tr_TR",
  language: "tr",
  currency: "TRY",
  currencyLocale: "tr-TR",
  country: "TR",
} as const;

export const COLLECTIONS = {
  products: "products",
  categories: "categories",
  siteSettings: "site_settings",
  homepage: "homepage",
  about: "about",
  contactMessages: "contact_messages",
  quoteRequests: "quote_requests",
  productReviews: "product_reviews",
  banners: "banners",
  gallery: "gallery",
  admins: "admins",
} as const;

export const DOCUMENTS = {
  siteSettings: "global",
  homepage: "main",
  about: "main",
} as const;

export const ROUTES = {
  home: "/",
  about: "/hakkimizda",
  products: "/urunler",
  contact: "/iletisim",
  cart: "/sepet",

  admin: "/admin",
  adminLogin: "/admin/giris",
  adminDashboard: "/admin",
  adminProducts: "/admin/urunler",
  adminNewProduct: "/admin/urunler/yeni",
  adminCategories: "/admin/kategoriler",
  adminHomepage: "/admin/anasayfa",
  adminAbout: "/admin/hakkimizda",
  adminMessages: "/admin/mesajlar",
  adminQuoteRequests: "/admin/hizli-teklifler",
  adminReviews: "/admin/yorumlar",
  adminSettings: "/admin/ayarlar",
  adminSeo: "/admin/seo",

  product: (slug: string) => `/urunler/${slug}`,
  category: (slug: string) => `/kategori/${slug}`,
  editProduct: (id: string) => `/admin/urunler/${id}`,
} as const;

export const STORAGE_PATHS = {
  products: "products",
  categories: "categories",
  homepage: "homepage",
  about: "about",
  gallery: "gallery",
  branding: "branding",
  banners: "banners",

  product: (productId: string) => `products/${productId}`,
  category: (categoryId: string) => `categories/${categoryId}`,
} as const;

export const PRODUCT_LIMITS = {
  titleMinLength: 2,
  titleMaxLength: 120,

  shortDescriptionMaxLength: 260,

  maxImages: 12,
  maxSpecifications: 50,

  featuredHomepageLimit: 8,
  relatedProductsLimit: 4,
  productsPerPage: 24,
} as const;

export const CATEGORY_LIMITS = {
  nameMaxLength: 80,
  descriptionMaxLength: 400,
  homepageLimit: 8,
} as const;

export const CONTACT_LIMITS = {
  fullNameMaxLength: 100,
  phoneMaxLength: 30,
  emailMaxLength: 160,
  subjectMaxLength: 150,
  messageMaxLength: 3000,
} as const;

export const QUICK_QUOTE_LIMITS = {
  additionalNotesMaxLength: 2500,
  selectedProductsMaxCount: 8,
  adminNoteMaxLength: 1200,
  offeredPriceMaxDigits: 12,
} as const;

export const PRODUCT_REVIEW_LIMITS = {
  fullNameMaxLength: 100,
  commentMaxLength: 1200,
  listPerProduct: 20,
} as const;

export const UPLOAD_LIMITS = {
  maxImageSizeBytes: 10 * 1024 * 1024,

  allowedImageTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ],
} as const;

export const IMAGE_ACCEPT = UPLOAD_LIMITS.allowedImageTypes.join(",");

export const DEFAULT_SEO: SeoConfig = {
  title: "Konya Spot | İkinci El Eşya Alım Satım – Uğur Bey Spot",
  description:
    "Konya'nın güvenilir spot mağazası Uğur Bey Spot'ta ikinci el mobilya, beyaz eşya, elektronik ve ev eşyası alım satımı yapın. Güncel ürünleri inceleyin, hızlı teklif alın.",
  keywords: [
    "Konya spot",
    "spot ikinci el",
    "Konya spotçu",
    "Konya ikinci el eşya",
    "Konya spot eşya",
    "ikinci el eşya Konya",
    "spot eşya Konya",
    "ikinci el mobilya Konya",
    "ikinci el beyaz eşya Konya",
    "ikinci el eşya alanlar Konya",
    "ikinci el eşya satanlar Konya",
    "2.el eşya Konya",
    "spot mobilya Konya",
    "spot beyaz eşya Konya",
    "ucuz ikinci el eşya Konya",
    "Konya spot mağaza",
    "Konya ikinci el mobilya",
    "Konya ikinci el beyaz eşya",
    "Konya ikinci el elektronik",
    "spot eşya alım satım Konya",
    "ikinci el eşya fiyatları Konya",
    "Uğur Bey Spot",
    "Uğur Bey Spot Konya",
    "Konya spot eşya mağazası",
    "Konya'da spotçu",
    "en ucuz spot eşya Konya",
  ],
  noIndex: false,
};

export const DEFAULT_PAGE_SEO = {
  home: DEFAULT_SEO,

  about: {
    title: "Konya Spot Eşya Uzmanı – Hakkımızda | Uğur Bey Spot",
    description:
      "Konya'da ikinci el eşya alım satımında güvenilir adres Uğur Bey Spot. Spot mobilya, beyaz eşya ve elektronik konusundaki deneyimimizi yakından tanıyın.",
    keywords: [
      "Uğur Bey Spot hakkında",
      "Uğur Bey Spot mağaza",
      "Konya spot mağaza",
      "Konya ikinci el eşya mağazası",
      "spot eşya alım satım",
      "Konya spotçu hakkında",
      "güvenilir spot mağaza Konya",
    ],
    noIndex: false,
  },

  products: {
    title: "Konya Spot Ürünler – İkinci El Mobilya, Beyaz Eşya, Elektronik",
    description:
      "Konya'da satışa sunulan ikinci el mobilya, beyaz eşya, elektronik ve spot ürünleri inceleyin. Güncel fiyat ve stok bilgisi için Uğur Bey Spot'a ulaşın.",
    keywords: [
      "Konya spot ürünler",
      "ikinci el ürünler Konya",
      "spot mobilya Konya",
      "ikinci el beyaz eşya Konya",
      "spot elektronik Konya",
      "ikinci el eşya fiyatları",
      "ucuz mobilya Konya",
      "2.el beyaz eşya Konya",
      "Konya spot eşya satış",
      "Uğur Bey Spot ürünler",
    ],
    noIndex: false,
  },

  contact: {
    title: "Konya Spot Mağaza İletişim – Adres, Telefon | Uğur Bey Spot",
    description:
      "Konya Uğur Bey Spot iletişim bilgileri, mağaza adresi, WhatsApp ve yol tarifi. İkinci el eşya satmak veya spot ürünler hakkında bilgi almak için bize ulaşın.",
    keywords: [
      "Uğur Bey Spot iletişim",
      "Uğur Bey Spot telefon",
      "Uğur Bey Spot adres",
      "Konya spotçu iletişim",
      "Konya ikinci el eşya telefon",
      "Konya spot mağaza adresi",
      "spot eşya Konya iletişim",
    ],
    noIndex: false,
  },
} satisfies Record<"home" | "about" | "products" | "contact", SeoConfig>;

export const PRODUCT_STATUS_LABELS = {
  active: "Aktif",
  passive: "Pasif",
  sold_out: "Tükendi",
} as const;

export const STOCK_STATUS_LABELS = {
  in_stock: "Stokta",
  low_stock: "Son Ürünler",
  out_of_stock: "Stokta Yok",
} as const;

export const MESSAGE_STATUS_LABELS = {
  new: "Yeni",
  read: "Okundu",
  answered: "Cevaplandı",
  replied: "Cevaplandı",
} as const;

export const ADMIN_ROLE_LABELS = {
  super_admin: "Süper Admin",
  admin: "Yönetici",
  editor: "Editör",
} as const;

export const SORT_OPTIONS = {
  newest: "newest",
  priceAscending: "price_asc",
  priceDescending: "price_desc",
  featured: "featured",
} as const;

export const SORT_OPTION_LABELS = {
  [SORT_OPTIONS.newest]: "Yeni Eklenenler",
  [SORT_OPTIONS.priceAscending]: "Fiyat: Artan",
  [SORT_OPTIONS.priceDescending]: "Fiyat: Azalan",
  [SORT_OPTIONS.featured]: "Öne Çıkanlar",
} as const;

export const QUERY_LIMITS = {
  adminRecentProducts: 5,
  adminRecentMessages: 5,
  homepageFeaturedProducts: 8,
  homepageCategories: 8,
  relatedProducts: 4,
} as const;

export const CACHE_TIMES = {
  publicContentSeconds: 60,
  productsSeconds: 60,
  siteSettingsSeconds: 300,
} as const;

export const FIREBASE_ERRORS = {
  permissionDenied: "permission-denied",
  notFound: "not-found",
  alreadyExists: "already-exists",
  unauthenticated: "unauthenticated",
} as const;

export const DEFAULT_WHATSAPP_MESSAGE =
  "Merhaba, Uğur Bey Spot ürünleri hakkında bilgi almak istiyorum.";

export const APP_ENV = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;
