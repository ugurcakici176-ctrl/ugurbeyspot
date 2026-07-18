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
  title: "Konya Spotçu | İkinci El Eşya Alım Satım | Uğur Bey Spot",
  description:
    "Konya'da ikinci el eşya alım satımı: mobilya, beyaz eşya, elektronik ve ev eşyaları. Güncel ürünleri inceleyin, Uğur Bey Spot'tan hızlı teklif alın.",
  keywords: [
    "Uğur Bey Spot",
    "Konya spotçu",
    "Konya ikinci el eşya",
    "Konya spot eşya",
    "ikinci el mobilya Konya",
    "ikinci el beyaz eşya Konya",
    "ikinci el eşya alanlar Konya",
  ],
  noIndex: false,
};

export const DEFAULT_PAGE_SEO = {
  home: DEFAULT_SEO,

  about: {
    title: "Konya İkinci El Eşya Uzmanı | Hakkımızda",
    description:
      "Konya'da ikinci el eşya alım satımı yapan Uğur Bey Spot'un ürün seçimi, güvenilir hizmet ve hızlı teklif yaklaşımını yakından tanıyın.",
    keywords: [
      "Uğur Bey Spot hakkında",
      "Uğur Bey Spot mağaza",
      "spot mağaza",
    ],
    noIndex: false,
  },

  products: {
    title: "Konya İkinci El Eşya ve Spot Ürünler",
    description:
      "Konya'da satışta olan ikinci el mobilya, beyaz eşya, elektronik ve spot ürünleri inceleyin. Güncel fiyat ve stok için Uğur Bey Spot'a ulaşın.",
    keywords: [
      "Uğur Bey Spot ürünler",
      "elektronik ürünler",
      "ev yaşam ürünleri",
      "spot ürünler",
    ],
    noIndex: false,
  },

  contact: {
    title: "Konya Spotçu İletişim ve Yol Tarifi",
    description:
      "Konya Uğur Bey Spot iletişim, WhatsApp ve yol tarifi bilgileri. İkinci el eşya satmak veya ürünlerimiz hakkında bilgi almak için bize ulaşın.",
    keywords: [
      "Uğur Bey Spot iletişim",
      "Uğur Bey Spot telefon",
      "Uğur Bey Spot adres",
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
