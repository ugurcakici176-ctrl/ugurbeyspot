import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ||
  initializeApp({
    credential: applicationDefault(),
    projectId: "ugurbeyspot-51329",
  });

const db = getFirestore(app);
const now = new Date().toISOString();

const categories = [
  ["Buzdolabı", "buzdolabi", "Konya'da ikinci el ve spot buzdolabı seçeneklerini inceleyin.", 1],
  ["Çamaşır Makinesi", "camasir-makinesi", "Konya'da ikinci el ve spot çamaşır makinesi seçeneklerini inceleyin.", 2],
  ["Bulaşık Makinesi", "bulasik-makinesi", "Konya'da ikinci el ve spot bulaşık makinesi seçeneklerini inceleyin.", 3],
  ["Fırın ve Ocak", "firin-ocak", "İkinci el fırın, ocak ve pişirme ürünlerini keşfedin.", 4],
  ["Televizyon ve Elektronik", "televizyon-elektronik", "İkinci el televizyon ve elektronik ürün seçeneklerini keşfedin.", 5],
  ["Koltuk ve Mobilya", "koltuk-mobilya", "Konya'da ikinci el koltuk ve ev mobilyası seçeneklerini inceleyin.", 6],
  ["Masa ve Sandalye", "masa-sandalye", "İkinci el yemek masası, mutfak masası ve sandalye seçeneklerini inceleyin.", 7],
  ["Küçük Ev Aletleri", "kucuk-ev-aletleri", "İkinci el ve spot küçük ev aletlerini avantajlı fiyatlarla keşfedin.", 8],
  ["Derin Dondurucu", "derin-dondurucu", "Konya'da ikinci el ve spot derin dondurucu seçeneklerini inceleyin.", 9],
  ["Klima", "klima", "Konya'da ikinci el ve spot klima seçeneklerini keşfedin.", 10],
];

for (const [name, slug, description, sortOrder] of categories) {
  const existing = await db.collection("categories").where("slug", "==", slug).limit(1).get();
  const imageUrl = `/images/categories/${slug}.jpg`;
  const payload = {
    name,
    slug,
    description,
    image: {
      id: `category-${slug}`,
      url: imageUrl,
      storagePath: "",
      alt: `${name} kategorisi - Uğur Bey Spot Konya`,
      width: 1254,
      height: 1254,
      sortOrder: 0,
    },
    status: "active",
    sortOrder,
    seo: {
      title: `${name} | Konya İkinci El ve Spot Ürünler`,
      description,
      keywords: [
        `${name} Konya`,
        `ikinci el ${name.toLocaleLowerCase("tr-TR")}`,
        `spot ${name.toLocaleLowerCase("tr-TR")}`,
        "Uğur Bey Spot",
      ],
      noIndex: false,
    },
    updatedAt: now,
  };

  if (existing.empty) {
    await db.collection("categories").add({ ...payload, createdAt: now });
    console.log(`created: ${slug}`);
  } else {
    await existing.docs[0].ref.set(payload, { merge: true });
    console.log(`updated: ${slug}`);
  }
}

process.exit(0);
