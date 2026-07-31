export type DocumentId = string;

export type ISODateString = string;

export type EntityStatus = "active" | "passive";

export type ProductStatus = "active" | "passive" | "sold_out";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type MessageStatus = "new" | "read" | "answered" | "replied";

export type ProductReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export type QuoteRequestStatus =
  | "new"
  | "reviewing"
  | "offered"
  | "closed";

export type SellRequestStatus =
  | "new"
  | "reviewing"
  | "offered"
  | "completed"
  | "rejected";

export type AdminRole = "super_admin" | "admin" | "editor";

export type ButtonTarget = "_self" | "_blank";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin";

export interface FirestoreEntity {
  id: DocumentId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface LinkConfig {
  label: string;
  href: string;
  target?: ButtonTarget;
}

export interface ImageAsset {
  id: string;
  url: string;
  storagePath: string;
  alt: string;
  width?: number;
  height?: number;
  sortOrder: number;
}

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

export interface Category extends FirestoreEntity {
  name: string;
  slug: string;
  description: string;
  image?: ImageAsset;
  status: EntityStatus;
  sortOrder: number;
  seo: SeoConfig;
}

export interface Product extends FirestoreEntity {
  title: string;
  slug: string;
  categoryId: DocumentId;
  categoryName?: string;
  shortDescription: string;
  description: string;

  price: number;
  compareAtPrice?: number | null;

  status: ProductStatus;
  stockStatus: StockStatus;

  featured: boolean;
  isNew: boolean;

  images: ImageAsset[];
  specifications: ProductSpecification[];

  seo: SeoConfig;
}

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  status: EntityStatus;
}

export interface HomeHero {
  eyebrow: string;
  title: string;
  highlightedText: string;
  description: string;

  primaryButton: LinkConfig;
  secondaryButton: LinkConfig;

  images: ImageAsset[];

  status: EntityStatus;
}

export interface CampaignBanner extends FirestoreEntity {
  title: string;
  description: string;

  button: LinkConfig;

  desktopImage?: ImageAsset;
  mobileImage?: ImageAsset;

  status: EntityStatus;
  sortOrder: number;
}

export interface HomeStoreSection {
  eyebrow: string;
  title: string;
  description: string;

  image?: ImageAsset;

  address: string;
  workingHoursText: string;

  directionsButton: LinkConfig;

  status: EntityStatus;
}

export interface HomeSocialSection {
  eyebrow: string;
  title: string;
  description: string;

  gallery: ImageAsset[];

  button?: LinkConfig;

  status: EntityStatus;
}

export interface HomeFinalCta {
  eyebrow: string;
  title: string;
  description: string;

  primaryButton: LinkConfig;
  secondaryButton: LinkConfig;

  status: EntityStatus;
}

export interface HomepageContent {
  hero: HomeHero;
  trustItems: TrustItem[];

  categoriesSection: {
    eyebrow: string;
    title: string;
    description: string;
  };

  featuredProductsSection: {
    eyebrow: string;
    title: string;
    description: string;
  };

  campaignSection: {
    eyebrow: string;
    title: string;
  };

  whyUsSection: {
    eyebrow: string;
    title: string;
    description: string;
    items: TrustItem[];
  };

  storeSection: HomeStoreSection;
  socialSection: HomeSocialSection;
  finalCta: HomeFinalCta;

  updatedAt: ISODateString;
}

export interface AboutValue {
  id: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface AboutStatistic {
  id: string;
  value: number;
  suffix?: string;
  label: string;
  sortOrder: number;
}

export interface AboutContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    image?: ImageAsset;
  };

  story: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    image?: ImageAsset;
  };

  values: {
    eyebrow: string;
    title: string;
    description: string;
    items: AboutValue[];
  };

  statistics: {
    eyebrow: string;
    title: string;
    items: AboutStatistic[];
  };

  gallery: {
    eyebrow: string;
    title: string;
    description: string;
    images: ImageAsset[];
  };

  seo: SeoConfig;

  updatedAt: ISODateString;
}

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
  status: EntityStatus;
}

export interface WorkingHour {
  id: string;
  dayLabel: string;
  openingTime?: string;
  closingTime?: string;
  isClosed: boolean;
  sortOrder: number;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  email: string;

  address: string;
  city: string;
  district: string;
  postalCode?: string;

  googleMapsUrl: string;
  googleMapsEmbedUrl?: string;

  socialLinks: SocialLink[];
  workingHours: WorkingHour[];

  updatedAt: ISODateString;
}

export interface ContactMessage extends FirestoreEntity {
  fullName: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;

  status: MessageStatus;
  adminReply?: string;
  repliedAt?: ISODateString;

  customerUid?: string;
  customerOnline?: boolean;
  lastCustomerSeenAt?: ISODateString;
  adminNotified?: boolean;
  lastMessage?: string;
  lastMessageAt?: ISODateString;
  lastSender?: "customer" | "admin";

  sourcePage?: string;
  userAgent?: string;
}

export interface ContactChatMessage {
  id: DocumentId;
  text: string;
  sender: "customer" | "admin";
  createdAt: ISODateString;
  read: boolean;
}

export interface ProductReview extends FirestoreEntity {
  productId: DocumentId;
  productSlug: string;
  productTitle: string;
  fullName: string;
  rating: number;
  comment: string;
  status: ProductReviewStatus;
  sourcePage?: string;
  adminNote?: string;
}

export interface QuoteRequestProductItem {
  productId: DocumentId;
  title: string;
  slug: string;
  price: number;
}

export interface QuoteRequestAnswers {
  need: string;
  budgetRange: string;
  urgency: string;
  additionalNotes?: string;
  purchaseType?: "single" | "bundle" | "unsure";
  condition?: "new" | "used" | "mixed";
  delivery?: "store" | "delivery" | "installation";
}

export interface QuoteRequestEstimate {
  min: number;
  max: number;
  currency: "TRY";
  calculatedAt: ISODateString;
}

export interface QuoteRequest extends FirestoreEntity {
  fullName: string;
  phone: string;
  email?: string;
  status: QuoteRequestStatus;
  selectedProducts: QuoteRequestProductItem[];
  answers: QuoteRequestAnswers;
  estimate?: QuoteRequestEstimate;
  sourcePage?: string;

  tracking?: LeadAttribution;

  adminNote?: string;
  offeredPrice?: number;
  offeredAt?: ISODateString;
}
export interface CustomerProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  district?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
export interface SellRequest extends FirestoreEntity {
  customerUid?: string;
  customerEmail?: string;
  fullName: string;
  phone: string;
  district?: string;
  category: string;
  brandModel?: string;
  condition: string;
  description: string;
  expectedPrice?: number;
  images: ImageAsset[];
  status: SellRequestStatus;
  adminNote?: string;
  offeredPrice?: number;
}

export interface SiteBranding {
  siteName: string;
  shortName: string;
  slogan: string;

  logo?: ImageAsset;
  darkLogo?: ImageAsset;
  favicon?: ImageAsset;
  defaultOgImage?: ImageAsset;
}

export interface SiteSeoSettings {
  defaultSeo: SeoConfig;

  homepageSeo: SeoConfig;
  aboutSeo: SeoConfig;
  productsSeo: SeoConfig;
  contactSeo: SeoConfig;
}

export interface SiteSettings {
  branding: SiteBranding;

  header: {
    navLabels: {
      home: string;
      about: string;
      products: string;
      contact: string;
    };
    primaryCtaLabel: string;
    primaryCtaHref: string;
    showAuthButtons: boolean;
  };

  contact: ContactSettings;

  seo: SiteSeoSettings;

  announcement: {
    text: string;
    href?: string;
    status: EntityStatus;
  };

  footer: {
    quickLinksTitle: string;
    contactTitle: string;
    storeTitle: string;
    description: string;
    copyrightText: string;
    bottomNote: string;
    legalLinks: Array<{
      id: string;
      label: string;
      href: string;
    }>;
  };

  updatedAt: ISODateString;
}

export interface AdminUser extends FirestoreEntity {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: EntityStatus;
  lastLoginAt?: ISODateString;
}
export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  gclid?: string;
  gbraid?: string;
  wbraid?: string;

  landingPage?: string;
  referrer?: string;
  capturedAt?: ISODateString;
}

export interface LeadAttribution {
  firstTouch?: AttributionData;
  lastTouch?: AttributionData;
} 
export interface DashboardSummary {
  totalProducts: number;
  activeProducts: number;
  soldOutProducts: number;
  totalCategories: number;
  newMessages: number;
}

export interface ProductFormValues {
  title: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;

  price: number;
  compareAtPrice: number | null;

  status: ProductStatus;
  stockStatus: StockStatus;

  featured: boolean;
  isNew: boolean;

  images: ImageAsset[];
  specifications: ProductSpecification[];

  seo: SeoConfig;
}

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  image?: ImageAsset;
  status: EntityStatus;
  sortOrder: number;
  seo: SeoConfig;
}

export interface ApiSuccess<TData> {
  success: true;
  data: TData;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;
