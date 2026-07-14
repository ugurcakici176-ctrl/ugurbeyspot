import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type LegalPageKey =
  | "privacy"
  | "kvkk"
  | "cookies"
  | "terms";

export interface LegalSection {
  id: string;
  title: string;
  body: string;
}

export interface LegalPageDocument {
  key: LegalPageKey;
  eyebrow: string;
  title: string;
  description: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
  updatedAt: string;
}

export const LEGAL_PAGE_LABELS: Record<
  LegalPageKey,
  string
> = {
  privacy: "Gizlilik Politikası",
  kvkk: "KVKK Aydınlatma Metni",
  cookies: "Çerez Politikası",
  terms: "Kullanım Koşulları",
};

export const DEFAULT_LEGAL_PAGES: Record<
  LegalPageKey,
  LegalPageDocument
> = {
  privacy: {
    key: "privacy",
    eyebrow: "GİZLİLİK",
    title: "Gizlilik Politikası",
    description:
      "Uğur Bey Spot web sitesindeki bilgi ve veri işleme süreçlerine ilişkin genel bilgilendirme.",
    lastUpdatedLabel: "Son güncelleme: Temmuz 2026",
    sections: [
      {
        id: "privacy-general",
        title: "1. Genel Bilgilendirme",
        body:
          "Uğur Bey Spot olarak ziyaretçilerimizin gizliliğine önem veriyoruz. Bu politika, web sitemizin kullanımı sırasında elde edilebilecek bilgilerin hangi genel amaçlarla işlenebileceğini açıklamak amacıyla hazırlanmıştır.",
      },
      {
        id: "privacy-data",
        title: "2. İşlenebilecek Bilgiler",
        body:
          "İletişim formunun kullanılması halinde ad soyad, telefon numarası, e-posta adresi, mesaj konusu ve mesaj içeriği işlenebilir. Teknik altyapının güvenli ve kararlı çalışması amacıyla sınırlı teknik kayıtlar oluşabilir.",
      },
      {
        id: "privacy-purpose",
        title: "3. Kullanım Amaçları",
        body:
          "Paylaşılan bilgiler; iletişim taleplerinin cevaplanması, ürünler hakkında bilgi verilmesi, mağaza hizmetlerinin yürütülmesi, teknik sorunların giderilmesi ve hukuki yükümlülüklerin yerine getirilmesi amaçlarıyla işlenebilir.",
      },
      {
        id: "privacy-security",
        title: "4. Güvenlik ve Saklama",
        body:
          "Kişisel veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen sürelerle sınırlı olarak saklanır. Yetkisiz erişim ve hukuka aykırı kullanım risklerini azaltmak amacıyla makul teknik ve idari tedbirler uygulanır.",
      },
      {
        id: "privacy-contact",
        title: "5. İletişim",
        body:
          "Gizlilik ve kişisel verilerle ilgili sorularınızı İletişim sayfamızda yer alan güncel iletişim kanalları üzerinden Uğur Bey Spot'a iletebilirsiniz.",
      },
    ],
    updatedAt: "",
  },

  kvkk: {
    key: "kvkk",
    eyebrow: "KİŞİSEL VERİLER",
    title: "KVKK Aydınlatma Metni",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerin işlenmesine ilişkin bilgilendirme.",
    lastUpdatedLabel: "Son güncelleme: Temmuz 2026",
    sections: [
      {
        id: "kvkk-controller",
        title: "1. Veri Sorumlusu",
        body:
          "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, web sitesi ve mağaza faaliyetleri çerçevesinde işlenen kişisel veriler bakımından veri sorumlusu Uğur Bey Spot'tur. Resmî ticaret unvanı, açık adres ve başvuru iletişim bilgilerinin işletme kayıtlarıyla uyumlu şekilde güncel tutulması gerekir.",
      },
      {
        id: "kvkk-data",
        title: "2. İşlenen Kişisel Veriler",
        body:
          "Web sitesi iletişim formu üzerinden ad soyad, telefon, e-posta, konu, talep ve mesaj içeriği işlenebilir. Teknik güvenlik süreçlerinde sınırlı işlem güvenliği kayıtları oluşabilir.",
      },
      {
        id: "kvkk-purpose",
        title: "3. İşleme Amaçları",
        body:
          "Kişisel veriler; iletişim taleplerinin alınması ve cevaplanması, ürün ve mağaza hizmetleri hakkında bilgi verilmesi, müşteri ilişkilerinin yürütülmesi, bilgi güvenliği süreçlerinin sağlanması ve hukuki yükümlülüklerin yerine getirilmesi amaçlarıyla işlenebilir.",
      },
      {
        id: "kvkk-method",
        title: "4. Toplama Yöntemi ve Hukuki Sebep",
        body:
          "Kişisel veriler web sitesi iletişim formu, telefon, WhatsApp ve diğer iletişim kanalları üzerinden elektronik veya fiziki yöntemlerle elde edilebilir. Veriler, somut işleme faaliyetine göre yürürlükteki mevzuatta düzenlenen hukuki sebepler kapsamında işlenir.",
      },
      {
        id: "kvkk-transfer",
        title: "5. Kişisel Verilerin Aktarılması",
        body:
          "Kişisel veriler; mevzuattan doğan yükümlülüklerin yerine getirilmesi amacıyla yetkili kamu kurum ve kuruluşlarına ve gerekli olduğu ölçüde teknik altyapı hizmeti alınan hizmet sağlayıcılara aktarılabilir.",
      },
      {
        id: "kvkk-rights",
        title: "6. Haklarınız",
        body:
          "KVKK kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını öğrenme, şartları oluştuğunda düzeltme veya silme talep etme ve mevzuatta tanınan diğer hakları kullanabilirsiniz.",
      },
      {
        id: "kvkk-application",
        title: "7. Başvuru",
        body:
          "Kişisel verilerinize ilişkin taleplerinizi İletişim sayfasında yer alan güncel iletişim kanalları üzerinden veri sorumlusuna iletebilirsiniz.",
      },
    ],
    updatedAt: "",
  },

  cookies: {
    key: "cookies",
    eyebrow: "ÇEREZLER",
    title: "Çerez Politikası",
    description:
      "Web sitesindeki teknik depolama ve tercih mekanizmalarının kullanımına ilişkin bilgilendirme.",
    lastUpdatedLabel: "Son güncelleme: Temmuz 2026",
    sections: [
      {
        id: "cookies-general",
        title: "1. Çerez ve Benzeri Teknolojiler",
        body:
          "Çerezler ve benzeri tarayıcı depolama teknolojileri, internet sitelerinin belirli işlevleri sürdürebilmesi ve kullanıcı tercihlerini hatırlayabilmesi amacıyla kullanılabilir.",
      },
      {
        id: "cookies-required",
        title: "2. Kesinlikle Gerekli Teknolojiler",
        body:
          "Sitenin temel işlevlerinin, güvenliğinin ve tercih yönetiminin çalışması için gerekli teknik depolama mekanizmaları kullanılabilir.",
      },
      {
        id: "cookies-analytics",
        title: "3. Analitik Tercihi",
        body:
          "Analitik teknolojiler, ziyaretçilerin siteyi genel olarak nasıl kullandığını anlamaya yardımcı olabilir. Analitik tercih seçeneği varsayılan olarak kapalı tutulur.",
      },
      {
        id: "cookies-marketing",
        title: "4. Pazarlama Tercihi",
        body:
          "Reklam veya pazarlama amaçlı teknolojiler kullanıcı tercihine bağlı olarak kullanılabilir. Pazarlama tercihi varsayılan olarak kapalıdır.",
      },
      {
        id: "cookies-settings",
        title: "5. Tercihlerin Değiştirilmesi",
        body:
          "Çerez tercihinizi ilk ziyaretinizde görüntülenen panel üzerinden belirleyebilir ve site alt bölümünde bulunan Çerez Tercihleri bağlantısından daha sonra yeniden değiştirebilirsiniz.",
      },
    ],
    updatedAt: "",
  },

  terms: {
    key: "terms",
    eyebrow: "KULLANIM",
    title: "Kullanım Koşulları",
    description:
      "Uğur Bey Spot web sitesinin kullanımına ilişkin temel koşullar.",
    lastUpdatedLabel: "Son güncelleme: Temmuz 2026",
    sections: [
      {
        id: "terms-scope",
        title: "1. Kapsam",
        body:
          "Bu kullanım koşulları, Uğur Bey Spot web sitesinin ziyaret edilmesi ve sitede sunulan bilgi ve iletişim hizmetlerinin kullanılmasına ilişkin temel kuralları düzenler.",
      },
      {
        id: "terms-products",
        title: "2. Ürün Bilgileri",
        body:
          "Web sitesindeki ürün görselleri, açıklamalar, fiyatlar ve stok bilgileri bilgilendirme amacıyla sunulur. Spot ürünlerin niteliği gereği ürün, stok ve fiyat bilgileri değişebilir.",
      },
      {
        id: "terms-sales",
        title: "3. Satış İşlemleri",
        body:
          "Web sitesinde doğrudan çevrim içi ödeme ve mesafeli satış özelliği bulunmadığı sürece site üzerindeki ürün gösterimleri tek başına satış sözleşmesi oluşturmaz.",
      },
      {
        id: "terms-rights",
        title: "4. Fikri Haklar",
        body:
          "Web sitesinde yer alan marka unsurları, özgün metinler, tasarım öğeleri ve Uğur Bey Spot'a ait görsel içerikler ilgili hak sahiplerinin izni olmadan ticari amaçlarla kullanılamaz.",
      },
      {
        id: "terms-changes",
        title: "5. Değişiklikler",
        body:
          "Uğur Bey Spot, site içeriğini ve kullanım koşullarını gerektiğinde güncelleyebilir.",
      },
    ],
    updatedAt: "",
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getLegalPage(
  key: LegalPageKey,
): Promise<LegalPageDocument> {
  const fallback = clone(
    DEFAULT_LEGAL_PAGES[key],
  );

  try {
    const snapshot = await getDoc(
      doc(db, "legal_pages", key),
    );

    if (!snapshot.exists()) {
      return fallback;
    }

    const data =
      snapshot.data() as Partial<LegalPageDocument>;

    return {
      ...fallback,
      ...data,
      key,
      sections:
        Array.isArray(data.sections) &&
        data.sections.length > 0
          ? data.sections
          : fallback.sections,
    };
  } catch (error) {
    console.error(
      `Legal page "${key}" could not be loaded:`,
      error,
    );

    return fallback;
  }
}

export async function saveLegalPage(
  page: LegalPageDocument,
): Promise<void> {
  const now = new Date().toISOString();

  await setDoc(
    doc(db, "legal_pages", page.key),
    {
      ...page,
      updatedAt: now,
    },
    {
      merge: true,
    },
  );
}
