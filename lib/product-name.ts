/**
 * Ürün adlarını otomatik düzeltir: bilinen marka / eşya adı yazım hataları
 * ("Bosc" → "Bosch", "ayak kabilik" → "Ayakkabılık") ve Türkçe baş harf düzeni
 * ("çamaşır makinesi" → "Çamaşır Makinesi"). Admin ürün editörü ve ürün
 * listesindeki toplu "İsimleri düzelt" aracı kullanır.
 *
 * Yeni bir hata görülürse aşağıdaki listelere eklemek yeterli. Anahtarlar
 * küçük harf (tr-TR) yazılır.
 */

const lower = (value: string) => value.toLocaleLowerCase("tr-TR");

/** Birden fazla kelimelik hatalar (önce bunlar uygulanır). */
const PHRASE_FIXES: Record<string, string> = {
  "ayak kabilik": "Ayakkabılık",
  "ayak kabılık": "Ayakkabılık",
  "ayakkabı dolabı": "Ayakkabı Dolabı",
  "çamaşır makinası": "Çamaşır Makinesi",
  "bulaşık makinası": "Bulaşık Makinesi",
  "kurutma makinası": "Kurutma Makinesi",
  "derin dondurucu": "Derin Dondurucu",
  "hotpoint ariston": "Hotpoint-Ariston",
};

/** Tek kelimelik hatalar ve markaların doğru yazımı. */
const WORD_FIXES: Record<string, string> = {
  // Markalar
  bosc: "Bosch",
  bosh: "Bosch",
  bossch: "Bosch",
  bosch: "Bosch",
  boke: "Beko",
  beco: "Beko",
  bekoo: "Beko",
  beko: "Beko",
  arcelik: "Arçelik",
  arçelık: "Arçelik",
  arcelık: "Arçelik",
  arçlik: "Arçelik",
  arçelik: "Arçelik",
  vestl: "Vestel",
  westel: "Vestel",
  vestel: "Vestel",
  simens: "Siemens",
  seimens: "Siemens",
  siemens: "Siemens",
  profılo: "Profilo",
  profilo: "Profilo",
  grundıg: "Grundig",
  grundig: "Grundig",
  samsug: "Samsung",
  samsung: "Samsung",
  phılıps: "Philips",
  philps: "Philips",
  philips: "Philips",
  toshıba: "Toshiba",
  toshiba: "Toshiba",
  elektrolux: "Electrolux",
  electrolüx: "Electrolux",
  electrolux: "Electrolux",
  whirpool: "Whirlpool",
  wirlpool: "Whirlpool",
  whirlpool: "Whirlpool",
  indesıt: "Indesit",
  indesit: "Indesit",
  altus: "Altus",
  regal: "Regal",
  finlux: "Finlux",
  hisense: "Hisense",
  xiaomi: "Xiaomi",
  sinbo: "Sinbo",
  fakir: "Fakir",
  arzum: "Arzum",
  tefal: "Tefal",
  baymak: "Baymak",
  demirdöküm: "DemirDöküm",
  lg: "LG",
  aeg: "AEG",
  tcl: "TCL",
  seg: "SEG",
  // Eşya adları
  kardolabı: "Gardırop",
  kardolap: "Gardırop",
  gardolap: "Gardırop",
  gardolabı: "Gardırop",
  gardrop: "Gardırop",
  gardorop: "Gardırop",
  ayakkabilik: "Ayakkabılık",
  ayakabılık: "Ayakkabılık",
  ayakabilik: "Ayakkabılık",
  buzdolabi: "Buzdolabı",
  buzdolab: "Buzdolabı",
  camasir: "Çamaşır",
  çamasır: "Çamaşır",
  bulasik: "Bulaşık",
  makinası: "Makinesi",
  makinasi: "Makinesi",
  makinesi: "Makinesi",
  firin: "Fırın",
  baslik: "Başlık",
  takimi: "Takımı",
  odasi: "Odası",
  supurge: "Süpürge",
  sandelye: "Sandalye",
  televizyon: "Televizyon",
  tv: "TV",
};

/** Cümle içinde küçük kalan bağlaçlar. */
const SMALL_WORDS = new Set(["ve", "ile", "için", "veya", "de", "da"]);

function capitalizeWord(word: string, isFirst: boolean): string {
  if (!word) return word;

  const lowered = lower(word);

  if (!isFirst && SMALL_WORDS.has(lowered)) {
    return lowered;
  }

  // Rakam içeren (7kg, 55", 2+1) ve kısa kısaltmalar (LG, TV) olduğu gibi kalır.
  if (/\d/.test(word) || (word.length <= 4 && word === word.toLocaleUpperCase("tr-TR"))) {
    return word;
  }

  return lowered.charAt(0).toLocaleUpperCase("tr-TR") + lowered.slice(1);
}

function replacePhrases(value: string): string {
  let result = value;

  for (const [wrong, right] of Object.entries(PHRASE_FIXES)) {
    // Türkçe harflerde \b çalışmadığı için kelime sınırı boşluk/başlangıç/bitiş ile kontrol edilir.
    const pattern = new RegExp(
      `(^|[\\s(/-])${wrong.replace(/\s+/g, "\\s+")}(?=$|[\\s)/,.-])`,
      "giu",
    );
    result = result.replace(pattern, (_match, prefix: string) => `${prefix}${right}`);
  }

  return result;
}

/** Ürün adını düzeltir. Değişiklik yoksa aynı metni (boşlukları sadeleşmiş) döner. */
export function normalizeProductTitle(raw: string): string {
  let compact = raw.replace(/\s+/g, " ").trim();

  if (!compact) return compact;

  // Tamamı büyük harf yazılmışsa ("İNDİRİMLİ ÜTÜ") önce küçültülür.
  if (/\p{L}{4,}/u.test(compact) && compact === compact.toLocaleUpperCase("tr-TR")) {
    compact = lower(compact);
  }

  // Önce birden fazla kelimelik hatalar, sonra kelime kelime düzeltme.
  const phraseFixed = replacePhrases(compact);

  return phraseFixed
    .split(" ")
    .map((token, index) => {
      // Baştaki/sondaki noktalama korunur: "(Bosc)" → "(Bosch)"
      const match = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
      const [, lead = "", core = token, trail = ""] = match ?? [];
      const fixed = WORD_FIXES[lower(core)];

      return `${lead}${fixed ?? capitalizeWord(core, index === 0)}${trail}`;
    })
    .join(" ");
}

export interface ProductTitleFix {
  id: string;
  from: string;
  to: string;
}

/** Düzeltilmesi gereken ürünleri listeler (önizleme için). */
export function findProductTitleFixes(
  products: { id: string; title: string }[],
): ProductTitleFix[] {
  return products
    .map((product) => ({
      id: product.id,
      from: product.title,
      to: normalizeProductTitle(product.title),
    }))
    .filter((item) => item.to && item.to !== item.from);
}

/**
 * SEO başlığı eski ürün adını içeriyorsa yenisiyle değiştirir; elle yazılmış
 * farklı bir SEO başlığına dokunmaz.
 */
export function replaceTitleInSeo(seoTitle: string, from: string, to: string): string {
  const source = from.trim();

  if (!seoTitle || !source) return seoTitle;

  const index = lower(seoTitle).indexOf(lower(source));

  return index === -1
    ? seoTitle
    : `${seoTitle.slice(0, index)}${to}${seoTitle.slice(index + source.length)}`;
}
