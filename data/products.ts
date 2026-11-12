/**
 * Single source of truth for the catalog. Every page renders from this file:
 * to add or edit a product, change it here and put its PNG in
 * public/products/{category}/ (WebP versions are generated at build time).
 *
 * Source: Musaffo agent catalog, PDF pages 4–9. Descriptions are written from the product pages
 * on musaffo.uz. Where that site's specs differ from the PDF, the PDF is used.
 * Packshots are musaffo.uz's high-resolution cut-outs, except IMMUN+ 900 g, which is the PDF crop
 * (the site shows only the 200 g bottle). The PDF crops are kept in assets/pdf-packshots/.
 */

export type Localized = { uz: string; ru: string; en: string };

export type CategorySlug =
  | "drinking-yogurt"
  | "thick-yogurt"
  | "glazed-sirok"
  | "milk"
  | "butter-qatiq"
  | "kefir-ayron";

export type BrandLine = "musaffo" | "engil" | "immun";

/** A product's colour world on its page and tiles. The palette is in lib/tints.ts. */
export type Tint =
  | "strawberry"
  | "pomegranate"
  | "raspberry"
  | "cherry"
  | "forest"
  | "peach"
  | "banana"
  | "pineapple"
  | "cocoa"
  | "coconut"
  | "vanilla"
  | "milk"
  | "meadow"
  | "lagoon"
  | "basil"
  | "immun"
  | "butter";

/** Piece count and packshot differ by size (e.g. kefir 450 g: 12 pcs, 900 g: 8 pcs), so they live here. */
export type ProductSize = {
  amount: number;
  unit: "g" | "L";
  piecesPerBox: number;
  /** Path under /public to the PNG packshot of this size. */
  image: string;
};

export type StorageRule = {
  tempRange: string;
  shelfLife: { value: number; unit: "days" | "months" };
};

export type Product = {
  id: string;
  slug: string;
  category: CategorySlug;
  line: BrandLine;
  /** Products sharing a group are shown as selectable variant chips of each other. */
  group: string;
  tint: Tint;
  /** Giant word on the product stage, for products with no flavour label to show. */
  short?: Localized;
  name: Localized;
  /** One or two sentences, shown under the product name and used as the meta description. */
  description: Localized;
  /** Flavour or variant label on the chip; null when the product has no variants. */
  flavour: Localized | null;
  fatPercent: number;
  sizes: ProductSize[];
  storage: StorageRule[];
};

export type Category = {
  slug: CategorySlug;
  /** Whether chips on the product page are labelled "flavour" or "type". */
  variantKind: "flavour" | "type";
  /** Packshots used on the home page category card. */
  images: string[];
};

export const categories: Category[] = [
  {
    slug: "drinking-yogurt",
    variantKind: "flavour",
    images: [
      "/products/drinking-yogurt/engil-drinking-strawberry.png",
      "/products/drinking-yogurt/musaffo-drinking-peach.png",
      "/products/drinking-yogurt/immun-plus-200g.png",
    ],
  },
  {
    slug: "thick-yogurt",
    variantKind: "flavour",
    images: [
      "/products/thick-yogurt/engil-thick-peach.png",
      "/products/thick-yogurt/musaffo-thick-strawberry.png",
    ],
  },
  {
    slug: "glazed-sirok",
    variantKind: "flavour",
    images: [
      "/products/glazed-sirok/engil-sirok-strawberry.png",
      "/products/glazed-sirok/musaffo-sirok-cocoa.png",
      "/products/glazed-sirok/musaffo-sirok-vanilla.png",
    ],
  },
  {
    slug: "milk",
    variantKind: "type",
    images: ["/products/milk/milk-1.png", "/products/milk/milk-3-2.png", "/products/milk/milk-4.png"],
  },
  {
    slug: "butter-qatiq",
    variantKind: "type",
    images: ["/products/butter-qatiq/butter-anaviy.png", "/products/butter-qatiq/qatiq-3.png"],
  },
  {
    slug: "kefir-ayron",
    variantKind: "type",
    images: [
      "/products/kefir-ayron/kefir-1-450g.png",
      "/products/kefir-ayron/bio-kefir-900g.png",
      "/products/kefir-ayron/ayron-basil-450g.png",
    ],
  },
];

/* Storage rules, as printed in the catalog */
const chilled = (value: number, unit: "days" | "months"): StorageRule[] => [
  { tempRange: "+2…+6 °C", shelfLife: { value, unit } },
];
const YOGURT_STORAGE = chilled(4, "months");
const IMMUN_STORAGE = chilled(20, "days");
const KEFIR_STORAGE = chilled(21, "days");
const QATIQ_STORAGE = chilled(15, "days");
const SIROK_STORAGE: StorageRule[] = [
  { tempRange: "+2…+6 °C", shelfLife: { value: 12, unit: "days" } },
  { tempRange: "≤ −18 °C", shelfLife: { value: 120, unit: "days" } },
];
const MILK_STORAGE: StorageRule[] = [{ tempRange: "+2…+25 °C", shelfLife: { value: 6, unit: "months" } }];
const BUTTER_STORAGE: StorageRule[] = [
  { tempRange: "+1…+5 °C", shelfLife: { value: 35, unit: "days" } },
  { tempRange: "−9…−3 °C", shelfLife: { value: 60, unit: "days" } },
  { tempRange: "−18…−14 °C", shelfLife: { value: 120, unit: "days" } },
];

/* Size helpers: one packshot per size */
const grams = (amount: number, piecesPerBox: number, image: string): ProductSize => ({
  amount,
  unit: "g",
  piecesPerBox,
  image,
});
const dy = (file: string) => `/products/drinking-yogurt/${file}.png`;
const ty = (file: string) => `/products/thick-yogurt/${file}.png`;
const gs = (file: string) => `/products/glazed-sirok/${file}.png`;
const ml = (file: string) => `/products/milk/${file}.png`;
const bq = (file: string) => `/products/butter-qatiq/${file}.png`;
const ka = (file: string) => `/products/kefir-ayron/${file}.png`;

export const products: Product[] = [
  /* ───────── Drinking yogurts ───────── */
  {
    // The catalog captions these two packs "peach" and "cherry", but both packs show the same
    // artwork, and musaffo.uz lists it as vanilla, so this is one product in two sizes.
    id: "dy-immun",
    slug: "immun-plus",
    category: "drinking-yogurt",
    line: "immun",
    group: "immun-plus",
    tint: "immun",
    short: { uz: "IMMUN+", ru: "IMMUN+", en: "IMMUN+" },
    name: {
      uz: "IMMUN+ ichimlik yogurt",
      ru: "Питьевой йогурт IMMUN+",
      en: "IMMUN+ drinking yogurt",
    },
    description: {
      uz: "Vanil ta’mli klassik IMMUN+ bioyogurti, ta’mi nozik. 200 g va 900 g hajmdagi idishlarda chiqariladi.",
      ru: "Классический биойогурт IMMUN+ с ванилью и нежным вкусом. Выпускается в бутылках 200 г и 900 г.",
      en: "Classic IMMUN+ bio-yogurt with vanilla and a delicate taste. Comes in 200 g and 900 g bottles.",
    },
    flavour: null,
    fatPercent: 3.2,
    sizes: [grams(200, 15, dy("immun-plus-200g")), grams(900, 6, dy("immun-plus-900g"))],
    storage: IMMUN_STORAGE,
  },
  // 0.8% line: flavours follow the printed packs and musaffo.uz. The catalog captions under
  // them (strawberry, banana, peach, cherry) do not match.
  {
    id: "dy-engil-pomegranate",
    slug: "engil-drinking-pomegranate",
    category: "drinking-yogurt",
    line: "engil",
    group: "engil-drinking",
    tint: "pomegranate",
    name: {
      uz: "Anor bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками граната",
      en: "Drinking yogurt with pomegranate pieces",
    },
    description: {
      uz: "Anor bo‘lakchali yengil ichimlik yogurt, yog‘liligi 0,8%. Tamaddi uchun qulay tanlov.",
      ru: "Лёгкий питьевой йогурт с кусочками граната и жирностью 0,8%. Удобный вариант для перекуса.",
      en: "A light drinking yogurt with pomegranate pieces and 0.8% fat. A convenient choice for a snack.",
    },
    flavour: { uz: "Anor", ru: "Гранат", en: "Pomegranate" },
    fatPercent: 0.8,
    sizes: [grams(270, 15, dy("engil-drinking-pomegranate"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-engil-banana",
    slug: "engil-drinking-banana",
    category: "drinking-yogurt",
    line: "engil",
    group: "engil-drinking",
    tint: "banana",
    name: {
      uz: "Banan bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками банана",
      en: "Drinking yogurt with banana pieces",
    },
    description: {
      uz: "Banan bo‘lakchali, ta’mi nozik yengil ichimlik yogurt, yog‘liligi 0,8%. Tamaddi uchun qulay.",
      ru: "Нежный питьевой йогурт с кусочками банана и жирностью 0,8%. Подходит для лёгкого перекуса.",
      en: "A gentle drinking yogurt with banana pieces and 0.8% fat. Well suited to a light snack.",
    },
    flavour: { uz: "Banan", ru: "Банан", en: "Banana" },
    fatPercent: 0.8,
    sizes: [grams(270, 15, dy("engil-drinking-banana"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-engil-strawberry",
    slug: "engil-drinking-strawberry",
    category: "drinking-yogurt",
    line: "engil",
    group: "engil-drinking",
    tint: "strawberry",
    name: {
      uz: "Qulupnay bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками клубники",
      en: "Drinking yogurt with strawberry pieces",
    },
    description: {
      uz: "Qulupnay bo‘lakchali yengil ta’mli ichimlik yogurt, yog‘liligi 0,8%. Tamaddi uchun qulay.",
      ru: "Питьевой йогурт с кусочками клубники, лёгким вкусом и жирностью 0,8%. Удобно взять на перекус.",
      en: "A drinking yogurt with strawberry pieces, a light taste and 0.8% fat. Easy to take along for a snack.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 0.8,
    sizes: [grams(270, 15, dy("engil-drinking-strawberry"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-engil-peach",
    slug: "engil-drinking-peach",
    category: "drinking-yogurt",
    line: "engil",
    group: "engil-drinking",
    tint: "peach",
    name: {
      uz: "Shaftoli bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками персика",
      en: "Drinking yogurt with peach pieces",
    },
    description: {
      uz: "Shaftoli bo‘lakchali nozik ichimlik yogurt, yog‘liligi 0,8%. Yengil tamaddi uchun mos.",
      ru: "Лёгкий и нежный питьевой йогурт с кусочками персика, жирность 0,8%. Подходит для перекуса.",
      en: "A light, gentle drinking yogurt with peach pieces and 0.8% fat. Made for an easy snack.",
    },
    flavour: { uz: "Shaftoli", ru: "Персик", en: "Peach" },
    fatPercent: 0.8,
    sizes: [grams(270, 15, dy("engil-drinking-peach"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-musaffo-pineapple",
    slug: "musaffo-drinking-pineapple",
    category: "drinking-yogurt",
    line: "musaffo",
    group: "musaffo-drinking",
    tint: "pineapple",
    name: {
      uz: "Ananas bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками ананаса",
      en: "Drinking yogurt with pineapple pieces",
    },
    description: {
      uz: "Ananas bo‘lakchali nozik ichimlik yogurt. Tropik ta’mi tetiklik baxsh etadi.",
      ru: "Нежный питьевой йогурт с кусочками ананаса и освежающим тропическим вкусом.",
      en: "A smooth drinking yogurt with pineapple pieces and a refreshing tropical taste.",
    },
    flavour: { uz: "Ananas", ru: "Ананас", en: "Pineapple" },
    fatPercent: 1.5,
    sizes: [grams(270, 15, dy("musaffo-drinking-pineapple"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-musaffo-banana",
    slug: "musaffo-drinking-banana",
    category: "drinking-yogurt",
    line: "musaffo",
    group: "musaffo-drinking",
    tint: "banana",
    name: {
      uz: "Banan bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками банана",
      en: "Drinking yogurt with banana pieces",
    },
    description: {
      uz: "Banan bo‘lakchali ichimlik yogurt, ta’mi yumshoq va qaymoqli.",
      ru: "Питьевой йогурт с кусочками банана, с мягким сливочным вкусом.",
      en: "A drinking yogurt with banana pieces and a mild, creamy taste.",
    },
    flavour: { uz: "Banan", ru: "Банан", en: "Banana" },
    fatPercent: 1.5,
    sizes: [grams(270, 15, dy("musaffo-drinking-banana"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-musaffo-strawberry",
    slug: "musaffo-drinking-strawberry",
    category: "drinking-yogurt",
    line: "musaffo",
    group: "musaffo-drinking",
    tint: "strawberry",
    name: {
      uz: "Qulupnay bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками клубники",
      en: "Drinking yogurt with strawberry pieces",
    },
    description: {
      uz: "Qulupnay bo‘lakchali ichimlik yogurt, mevali ta’mi yorqin.",
      ru: "Питьевой йогурт с кусочками клубники и ярким фруктовым вкусом.",
      en: "A drinking yogurt with strawberry pieces and a bright, fruity taste.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 1.5,
    sizes: [grams(270, 15, dy("musaffo-drinking-strawberry"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-musaffo-peach",
    slug: "musaffo-drinking-peach",
    category: "drinking-yogurt",
    line: "musaffo",
    group: "musaffo-drinking",
    tint: "peach",
    name: {
      uz: "Shaftoli bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками персика",
      en: "Drinking yogurt with peach pieces",
    },
    description: {
      uz: "Shaftoli bo‘lakchali ichimlik yogurt, mevali xushbo‘y hidi nozik.",
      ru: "Питьевой йогурт с кусочками персика и нежным фруктовым ароматом.",
      en: "A drinking yogurt with peach pieces and a delicate fruity aroma.",
    },
    flavour: { uz: "Shaftoli", ru: "Персик", en: "Peach" },
    fatPercent: 1.5,
    sizes: [grams(270, 15, dy("musaffo-drinking-peach"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "dy-musaffo-cherry",
    slug: "musaffo-drinking-cherry",
    category: "drinking-yogurt",
    line: "musaffo",
    group: "musaffo-drinking",
    tint: "cherry",
    name: {
      uz: "Olcha bo‘lakchali ichimlik yogurt",
      ru: "Питьевой йогурт с кусочками вишни",
      en: "Drinking yogurt with cherry pieces",
    },
    description: {
      uz: "Olcha bo‘lakchali ichimlik yogurt, ta’mida yoqimli nordonlik seziladi.",
      ru: "Питьевой йогурт с кусочками вишни и приятной ягодной кислинкой.",
      en: "A drinking yogurt with cherry pieces and a pleasant, gently tart taste.",
    },
    flavour: { uz: "Olcha", ru: "Вишня", en: "Cherry" },
    fatPercent: 1.5,
    sizes: [grams(270, 15, dy("musaffo-drinking-cherry"))],
    storage: YOGURT_STORAGE,
  },

  /* ───────── Thick yogurts ───────── */
  {
    id: "ty-engil-peach",
    slug: "engil-thick-peach",
    category: "thick-yogurt",
    line: "engil",
    group: "engil-thick",
    tint: "peach",
    name: {
      uz: "Shaftoli ta’mli quyuq yogurt",
      ru: "Густой йогурт со вкусом персика",
      en: "Thick yogurt with peach flavor",
    },
    description: {
      uz: "Shaftoli ta’mli yengil quyuq yogurt, yog‘liligi 0,8%. 110 g hajmdagi qulay idishda.",
      ru: "Лёгкий густой йогурт с нежным вкусом персика и жирностью 0,8%. Удобный стаканчик 110 г.",
      en: "A light thick yogurt with a delicate peach flavor and 0.8% fat, in a handy 110 g cup.",
    },
    flavour: { uz: "Shaftoli", ru: "Персик", en: "Peach" },
    fatPercent: 0.8,
    sizes: [grams(110, 16, ty("engil-thick-peach"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-engil-strawberry",
    slug: "engil-thick-strawberry",
    category: "thick-yogurt",
    line: "engil",
    group: "engil-thick",
    tint: "strawberry",
    name: {
      uz: "Qulupnay ta’mli quyuq yogurt",
      ru: "Густой йогурт со вкусом клубники",
      en: "Thick yogurt with strawberry flavor",
    },
    description: {
      uz: "Qulupnay ta’mi to‘yingan yengil quyuq yogurt, yog‘liligi 0,8%. 110 g hajmdagi idishda.",
      ru: "Лёгкий густой йогурт с насыщенным клубничным вкусом и жирностью 0,8%, в стаканчике 110 г.",
      en: "A light thick yogurt with a rich strawberry flavor and 0.8% fat, in a 110 g cup.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 0.8,
    sizes: [grams(110, 16, ty("engil-thick-strawberry"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-engil-pineapple",
    slug: "engil-thick-pineapple",
    category: "thick-yogurt",
    line: "engil",
    group: "engil-thick",
    tint: "pineapple",
    name: {
      uz: "Ananas ta’mli quyuq yogurt",
      ru: "Густой йогурт со вкусом ананаса",
      en: "Thick yogurt with pineapple flavor",
    },
    description: {
      uz: "Ananasning tropik ta’miga ega tetiklantiruvchi quyuq yogurt, yog‘liligi 0,8%.",
      ru: "Освежающий густой йогурт с тропическим вкусом ананаса и жирностью 0,8%.",
      en: "A refreshing thick yogurt with a tropical pineapple flavor and 0.8% fat.",
    },
    flavour: { uz: "Ananas", ru: "Ананас", en: "Pineapple" },
    fatPercent: 0.8,
    sizes: [grams(110, 16, ty("engil-thick-pineapple"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-engil-banana",
    slug: "engil-thick-banana",
    category: "thick-yogurt",
    line: "engil",
    group: "engil-thick",
    tint: "banana",
    name: {
      uz: "Banan ta’mli quyuq yogurt",
      ru: "Густой йогурт со вкусом банана",
      en: "Thick yogurt with banana flavor",
    },
    description: {
      uz: "Pishgan banan ta’mi yumshoq yengil quyuq yogurt, yog‘liligi 0,8%.",
      ru: "Лёгкий густой йогурт с мягким вкусом спелого банана и жирностью 0,8%.",
      en: "A light thick yogurt with the mild taste of ripe banana and 0.8% fat.",
    },
    flavour: { uz: "Banan", ru: "Банан", en: "Banana" },
    fatPercent: 0.8,
    sizes: [grams(110, 16, ty("engil-thick-banana"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-raspberry",
    slug: "musaffo-thick-raspberry",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "raspberry",
    name: {
      uz: "Malina ta’mli yogurt",
      ru: "Йогурт со вкусом малины",
      en: "Yogurt with raspberry flavor",
    },
    description: {
      uz: "Malina ta’mli nozik yogurt, 110 g hajmdagi qulay idishda.",
      ru: "Нежный йогурт со вкусом малины в удобном стаканчике 110 г.",
      en: "A smooth yogurt with raspberry flavor, in a handy 110 g cup.",
    },
    flavour: { uz: "Malina", ru: "Малина", en: "Raspberry" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-raspberry"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-forest-berries",
    slug: "musaffo-thick-forest-berries",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "forest",
    name: {
      uz: "Yogurt o‘rmon reza mevalari bo‘lakchalari bilan",
      ru: "Йогурт с кусочками лесных ягод",
      en: "Yogurt with forest berry pieces",
    },
    description: {
      uz: "O‘rmon reza mevalari bo‘lakchalari solingan quyuq yogurt, rezavor ta’mi to‘yingan.",
      ru: "Густой йогурт с кусочками лесных ягод и насыщенным ягодным вкусом.",
      en: "A thick yogurt with forest berry pieces and a rich berry taste.",
    },
    flavour: { uz: "O‘rmon reza mevalari", ru: "Лесные ягоды", en: "Forest berries" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-forest-berries"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-peach",
    slug: "musaffo-thick-peach",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "peach",
    name: {
      uz: "Yogurt shaftoli bo‘lakchalari bilan",
      ru: "Йогурт с кусочками персика",
      en: "Yogurt with peach pieces",
    },
    description: {
      uz: "Pishgan shaftoli bo‘lakchalari solingan nozik yogurt, ta’mi yumshoq va qaymoqli.",
      ru: "Нежный йогурт с кусочками спелого персика и мягким сливочным вкусом.",
      en: "A smooth yogurt with pieces of ripe peach and a mild, creamy taste.",
    },
    flavour: { uz: "Shaftoli", ru: "Персик", en: "Peach" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-peach"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-banana",
    slug: "musaffo-thick-banana",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "banana",
    name: {
      uz: "Yogurt banan bo‘lakchalari bilan",
      ru: "Йогурт с кусочками банана",
      en: "Yogurt with banana pieces",
    },
    description: {
      uz: "Banan bo‘lakchalari solingan nozik quyuq yogurt, pishgan banan ta’miga ega.",
      ru: "Нежный густой йогурт с кусочками банана и вкусом спелого плода.",
      en: "A smooth thick yogurt with banana pieces and the taste of ripe fruit.",
    },
    flavour: { uz: "Banan", ru: "Банан", en: "Banana" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-banana"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-pineapple",
    slug: "musaffo-thick-pineapple",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "pineapple",
    name: {
      uz: "Yogurt ananas bo‘lakchalari bilan",
      ru: "Йогурт с кусочками ананаса",
      en: "Yogurt with pineapple pieces",
    },
    description: {
      uz: "Ananas bo‘lakchalari solingan quyuq yogurt, sutli ta’mi nozik.",
      ru: "Густой йогурт с кусочками сочного ананаса и нежным молочным вкусом.",
      en: "A thick yogurt with juicy pineapple pieces and a delicate milky taste.",
    },
    flavour: { uz: "Ananas", ru: "Ананас", en: "Pineapple" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-pineapple"))],
    storage: YOGURT_STORAGE,
  },
  {
    id: "ty-musaffo-strawberry",
    slug: "musaffo-thick-strawberry",
    category: "thick-yogurt",
    line: "musaffo",
    group: "musaffo-thick",
    tint: "strawberry",
    name: {
      uz: "Yogurt qulupnay bo‘lakchalari bilan",
      ru: "Йогурт с кусочками клубники",
      en: "Yogurt with strawberry pieces",
    },
    description: {
      uz: "Xushbo‘y qulupnay bo‘lakchalari solingan qaymoqsimon yogurt.",
      ru: "Кремовый йогурт с ароматными кусочками клубники.",
      en: "A creamy yogurt with fragrant strawberry pieces.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 1.5,
    sizes: [grams(110, 16, ty("musaffo-thick-strawberry"))],
    storage: YOGURT_STORAGE,
  },

  /* ───────── Glazed curd sirok ───────── */
  {
    id: "gs-engil-banana",
    slug: "engil-sirok-banana",
    category: "glazed-sirok",
    line: "engil",
    group: "engil-sirok",
    tint: "banana",
    name: {
      uz: "Banan ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом банана",
      en: "Glazed curd snack with banana flavor",
    },
    description: {
      uz: "Glazur bilan qoplangan tvorogli sirok, banan ta’mi yumshoq.",
      ru: "Творожный сырок в глазури с мягким банановым вкусом.",
      en: "A glazed curd snack with a mild banana flavor.",
    },
    flavour: { uz: "Banan", ru: "Банан", en: "Banana" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("engil-sirok-banana"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-engil-cocoa",
    slug: "engil-sirok-cocoa",
    category: "glazed-sirok",
    line: "engil",
    group: "engil-sirok",
    tint: "cocoa",
    name: {
      uz: "Kakao ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом какао",
      en: "Glazed curd snack with cocoa flavor",
    },
    description: {
      uz: "Tvorogli asosga va kakao ta’miga ega nozik glazurlangan sirok.",
      ru: "Нежный глазированный сырок на творожной основе со вкусом какао.",
      en: "A soft glazed curd snack with a curd base and cocoa flavor.",
    },
    flavour: { uz: "Kakao", ru: "Какао", en: "Cocoa" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("engil-sirok-cocoa"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-engil-strawberry",
    slug: "engil-sirok-strawberry",
    category: "glazed-sirok",
    line: "engil",
    group: "engil-sirok",
    tint: "strawberry",
    name: {
      uz: "Qulupnay ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом клубники",
      en: "Glazed curd snack with strawberry flavor",
    },
    description: {
      uz: "Qulupnay ta’mi to‘yingan ixcham glazurlangan tvorogli sirok.",
      ru: "Компактный глазированный творожный сырок с насыщенным клубничным вкусом.",
      en: "A compact glazed curd snack with a rich strawberry flavor.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("engil-sirok-strawberry"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-engil-vanilla",
    slug: "engil-sirok-vanilla",
    category: "glazed-sirok",
    line: "engil",
    group: "engil-sirok",
    tint: "vanilla",
    name: {
      uz: "Vanil ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом ванили",
      en: "Glazed curd snack with vanilla flavor",
    },
    description: {
      uz: "Klassik vanil ta’mli kichik glazurlangan tvorogli sirok.",
      ru: "Небольшой глазированный творожный сырок с классическим вкусом ванили.",
      en: "A small glazed curd snack with a classic vanilla flavor.",
    },
    flavour: { uz: "Vanil", ru: "Ваниль", en: "Vanilla" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("engil-sirok-vanilla"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-cocoa",
    slug: "musaffo-sirok-cocoa",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "cocoa",
    name: {
      uz: "Kakao ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом какао",
      en: "Glazed curd snack with cocoa flavor",
    },
    description: {
      uz: "Kakao ta’mi to‘yingan glazurlangan tvorogli sirok, 40 g.",
      ru: "Глазированный творожный сырок с насыщенным вкусом какао, 40 г.",
      en: "A 40 g glazed curd snack with a rich cocoa flavor.",
    },
    flavour: { uz: "Kakao", ru: "Какао", en: "Cocoa" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-cocoa"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-strawberry",
    slug: "musaffo-sirok-strawberry",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "strawberry",
    name: {
      uz: "Qulupnay ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом клубники",
      en: "Glazed curd snack with strawberry flavor",
    },
    description: {
      uz: "Tvorog va xushbo‘y qulupnay ta’mini uyg‘unlashtirgan nozik glazurlangan sirok, 40 g.",
      ru: "Нежный глазированный сырок, сочетающий творог и ароматный вкус клубники, 40 г.",
      en: "A soft 40 g glazed snack that pairs curd with a fragrant strawberry flavor.",
    },
    flavour: { uz: "Qulupnay", ru: "Клубника", en: "Strawberry" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-strawberry"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-coconut",
    slug: "musaffo-sirok-coconut",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "coconut",
    name: {
      uz: "Kokos ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом кокоса",
      en: "Glazed curd snack with coconut flavor",
    },
    description: {
      uz: "Kokos xushbo‘yligiga ega, tuzilishi yumshoq glazurlangan tvorogli sirok, 40 g.",
      ru: "Глазированный творожный сырок с мягкой текстурой и ароматом кокоса, 40 г.",
      en: "A 40 g glazed curd snack with a soft texture and a coconut aroma.",
    },
    flavour: { uz: "Kokos", ru: "Кокос", en: "Coconut" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-coconut"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-peach",
    slug: "musaffo-sirok-peach",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "peach",
    name: {
      uz: "Shaftoli ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом персика",
      en: "Glazed curd snack with peach flavor",
    },
    description: {
      uz: "Nozik tvorog va shaftoli ta’mini uyg‘unlashtirgan glazurlangan sirok, 40 g.",
      ru: "Глазированный сырок, сочетающий нежный творог и вкус персика, 40 г.",
      en: "A 40 g glazed snack that pairs soft curd with a peach flavor.",
    },
    flavour: { uz: "Shaftoli", ru: "Персик", en: "Peach" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-peach"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-vanilla",
    slug: "musaffo-sirok-vanilla",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "vanilla",
    name: {
      uz: "Vanil ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом ванили",
      en: "Glazed curd snack with vanilla flavor",
    },
    description: {
      uz: "Vanil ta’mi nozik klassik glazurlangan tvorogli sirok, 40 g.",
      ru: "Классический глазированный творожный сырок с нежным вкусом ванили, 40 г.",
      en: "A classic 40 g glazed curd snack with a delicate vanilla flavor.",
    },
    flavour: { uz: "Vanil", ru: "Ваниль", en: "Vanilla" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-vanilla"))],
    storage: SIROK_STORAGE,
  },
  {
    id: "gs-musaffo-cherry",
    slug: "musaffo-sirok-cherry",
    category: "glazed-sirok",
    line: "musaffo",
    group: "musaffo-sirok",
    tint: "cherry",
    name: {
      uz: "Olcha ta’mli glazurlangan tvorogli sirok",
      ru: "Глазированный творожный сырок со вкусом вишни",
      en: "Glazed curd snack with cherry flavor",
    },
    description: {
      uz: "Pishgan olchaning yorqin ta’miga ega nozik glazurlangan tvorogli sirok, 40 g.",
      ru: "Нежный глазированный творожный сырок с ярким вкусом спелой вишни, 40 г.",
      en: "A soft 40 g glazed curd snack with the bright taste of ripe cherry.",
    },
    flavour: { uz: "Olcha", ru: "Вишня", en: "Cherry" },
    fatPercent: 23,
    sizes: [grams(40, 30, gs("musaffo-sirok-cherry"))],
    storage: SIROK_STORAGE,
  },

  /* ───────── Sterilized milk ───────── */
  {
    id: "ml-1",
    slug: "milk-1",
    category: "milk",
    line: "musaffo",
    group: "milk",
    tint: "meadow",
    name: {
      uz: "Sterilizatsiyalangan yog‘siz sut 1%",
      ru: "Молоко стерилизованное нежирное 1%",
      en: "Sterilized low-fat milk 1%",
    },
    description: {
      uz: "Yog‘liligi 1% bo‘lgan yengil sterilizatsiyalangan sut, har kungi iste’mol uchun. Qadog‘i 1 litr.",
      ru: "Лёгкое стерилизованное молоко жирностью 1% на каждый день, в упаковке 1 литр.",
      en: "Light sterilized milk with 1% fat for every day, in a 1 liter carton.",
    },
    flavour: { uz: "Yog‘siz 1%", ru: "Нежирное 1%", en: "Low-fat 1%" },
    fatPercent: 1,
    sizes: [{ amount: 1, unit: "L", piecesPerBox: 12, image: ml("milk-1") }],
    storage: MILK_STORAGE,
  },
  {
    id: "ml-2",
    slug: "milk-2",
    category: "milk",
    line: "musaffo",
    group: "milk",
    tint: "milk",
    name: {
      uz: "Sterilizatsiyalangan kam yog‘li sut 2%",
      ru: "Молоко стерилизованное маложирное 2%",
      en: "Sterilized reduced-fat milk 2%",
    },
    description: {
      uz: "Yog‘liligi 2% bo‘lgan, tabiiy ta’mi yumshoq sterilizatsiyalangan sut. Qadog‘i 1 litr.",
      ru: "Стерилизованное молоко жирностью 2% с мягким натуральным вкусом, в упаковке 1 литр.",
      en: "Sterilized milk with 2% fat and a mild, natural taste, in a 1 liter carton.",
    },
    flavour: { uz: "Kam yog‘li 2%", ru: "Маложирное 2%", en: "Reduced-fat 2%" },
    fatPercent: 2,
    sizes: [{ amount: 1, unit: "L", piecesPerBox: 12, image: ml("milk-2") }],
    storage: MILK_STORAGE,
  },
  {
    id: "ml-3-2",
    slug: "milk-3-2",
    category: "milk",
    line: "musaffo",
    group: "milk",
    tint: "immun",
    name: {
      uz: "Sterilizatsiyalangan klassik sut 3,2%",
      ru: "Молоко стерилизованное классическое 3,2%",
      en: "Sterilized classic milk 3.2%",
    },
    description: {
      uz: "Yog‘liligi 3,2% bo‘lgan, ta’mi to‘yingan klassik sterilizatsiyalangan sut. Qadog‘i 1 litr.",
      ru: "Классическое стерилизованное молоко жирностью 3,2% с насыщенным вкусом, в упаковке 1 литр.",
      en: "Classic sterilized milk with 3.2% fat and a rich taste, in a 1 liter carton.",
    },
    flavour: { uz: "Klassik 3,2%", ru: "Классическое 3,2%", en: "Classic 3.2%" },
    fatPercent: 3.2,
    sizes: [{ amount: 1, unit: "L", piecesPerBox: 12, image: ml("milk-3-2") }],
    storage: MILK_STORAGE,
  },
  {
    id: "ml-4",
    slug: "milk-4",
    category: "milk",
    line: "musaffo",
    group: "milk",
    tint: "forest",
    name: {
      uz: "Sterilizatsiyalangan klassik sut 4%",
      ru: "Молоко стерилизованное классическое 4%",
      en: "Sterilized classic milk 4%",
    },
    description: {
      uz: "Yog‘liligi 4% bo‘lgan, qaymoqli ta’mi yorqin to‘yingan sterilizatsiyalangan sut. Qadog‘i 1 litr.",
      ru: "Насыщенное стерилизованное молоко жирностью 4% с выразительным сливочным вкусом, в упаковке 1 литр.",
      en: "Rich sterilized milk with 4% fat and a pronounced creamy taste, in a 1 liter carton.",
    },
    flavour: { uz: "Klassik 4%", ru: "Классическое 4%", en: "Classic 4%" },
    fatPercent: 4,
    sizes: [{ amount: 1, unit: "L", piecesPerBox: 12, image: ml("milk-4") }],
    storage: MILK_STORAGE,
  },

  /* ───────── Butter & qatiq ───────── */
  {
    id: "bq-butter",
    slug: "butter-anaviy",
    category: "butter-qatiq",
    line: "musaffo",
    group: "butter",
    tint: "butter",
    short: { uz: "Sariyog‘", ru: "Масло", en: "Butter" },
    name: {
      uz: "«An’anaviy» shirin qaymoqli tuzsiz sariyog‘, oliy nav",
      ru: "Масло сладко-сливочное несоленое «Традиционное», высшего сорта",
      en: "“Traditional” unsalted sweet-cream butter, premium grade",
    },
    description: {
      uz: "Yangi qaymoqdan tayyorlangan oliy navli tuzsiz sariyog‘, ta’mi nozik va qaymoqli. Yog‘liligi 82,5%.",
      ru: "Несолёное сливочное масло высшего сорта из свежих сливок с нежным вкусом. Жирность 82,5%.",
      en: "Unsalted premium-grade butter made from fresh cream, with a delicate taste and 82.5% fat.",
    },
    flavour: null,
    fatPercent: 82.5,
    sizes: [grams(200, 24, bq("butter-anaviy"))],
    storage: BUTTER_STORAGE,
  },
  {
    id: "bq-qatiq",
    slug: "qatiq-3",
    category: "butter-qatiq",
    line: "musaffo",
    group: "qatiq",
    tint: "milk",
    short: { uz: "Qatiq", ru: "Катык", en: "Qatiq" },
    name: {
      uz: "Qatiq 3%",
      ru: "Катык 3%",
      // "Qatiq" alone means nothing to an English reader.
      en: "Qatiq (fermented milk) 3%",
    },
    description: {
      uz: "Sutdan an’anaviy usulda tayyorlangan qatiq, quyuq va ta’mi to‘yingan. 900 g hajmdagi chelakchada.",
      ru: "Традиционный катык из молока, густой и с насыщенным вкусом. Ведёрко 900 г.",
      en: "Traditional qatiq made from milk, thick and rich in taste, in a 900 g tub.",
    },
    flavour: null,
    fatPercent: 3,
    sizes: [grams(900, 1, bq("qatiq-3"))],
    storage: QATIQ_STORAGE,
  },

  /* ───────── Kefir & ayron ───────── */
  {
    id: "ka-kefir-1",
    slug: "kefir-1",
    category: "kefir-ayron",
    line: "musaffo",
    group: "kefir",
    tint: "milk",
    name: {
      uz: "Yog‘siz kefir 1%",
      ru: "Кефир нежирный 1%",
      en: "Low-fat kefir 1%",
    },
    description: {
      uz: "Yog‘liligi 1% bo‘lgan, ta’mi yumshoq yengil nordon sut ichimligi. 450 g va 900 g hajmlarda.",
      ru: "Лёгкий кисломолочный напиток жирностью 1% с мягким вкусом. Выпускается по 450 г и 900 г.",
      en: "A light fermented milk drink with 1% fat and a mild taste. Comes in 450 g and 900 g bottles.",
    },
    flavour: { uz: "Yog‘siz 1%", ru: "Нежирный 1%", en: "Low-fat 1%" },
    fatPercent: 1,
    sizes: [grams(450, 12, ka("kefir-1-450g")), grams(900, 8, ka("kefir-1-900g"))],
    storage: KEFIR_STORAGE,
  },
  {
    id: "ka-kefir-2-5",
    slug: "kefir-2-5",
    category: "kefir-ayron",
    line: "musaffo",
    group: "kefir",
    tint: "lagoon",
    name: {
      uz: "Kam yog‘li kefir 2,5%",
      ru: "Кефир маложирный 2,5%",
      en: "Reduced-fat kefir 2.5%",
    },
    description: {
      uz: "Yog‘liligi 2,5% bo‘lgan an’anaviy kefir, tuzilishi nozik, ta’mi muvozanatli. 450 g va 900 g hajmlarda.",
      ru: "Традиционный кефир жирностью 2,5% с нежной консистенцией и сбалансированным вкусом. По 450 г и 900 г.",
      en: "Traditional kefir with 2.5% fat, a smooth texture and a balanced taste. Comes in 450 g and 900 g bottles.",
    },
    flavour: { uz: "Kam yog‘li 2,5%", ru: "Маложирный 2,5%", en: "Reduced-fat 2.5%" },
    fatPercent: 2.5,
    sizes: [grams(450, 12, ka("kefir-2-5-450g")), grams(900, 8, ka("kefir-2-5-900g"))],
    storage: KEFIR_STORAGE,
  },
  {
    // Only the 900 g bottle is pictured in the catalog.
    id: "ka-bio-kefir",
    slug: "bio-kefir",
    category: "kefir-ayron",
    line: "musaffo",
    group: "kefir",
    tint: "meadow",
    name: {
      uz: "Bio Kefir 2,5%",
      ru: "Био Кефир 2,5%",
      en: "Bio Kefir 2.5%",
    },
    description: {
      uz: "Maxsus kulturalar qo‘shib tayyorlangan kefir, yog‘liligi 2,5%. 900 g hajmdagi idishda.",
      ru: "Кефир, приготовленный с использованием специальных культур, жирность 2,5%. Бутылка 900 г.",
      en: "Kefir made with special cultures, with 2.5% fat, in a 900 g bottle.",
    },
    flavour: { uz: "Bio 2,5%", ru: "Био 2,5%", en: "Bio 2.5%" },
    fatPercent: 2.5,
    sizes: [grams(900, 8, ka("bio-kefir-900g"))],
    storage: KEFIR_STORAGE,
  },
  {
    id: "ka-ayron",
    slug: "ayron",
    category: "kefir-ayron",
    line: "musaffo",
    group: "ayron",
    tint: "meadow",
    short: { uz: "Ayron", ru: "Айран", en: "Ayran" },
    name: {
      uz: "Ayron 2,2%",
      ru: "Айран 2,2%",
      en: "Ayran 2.2%",
    },
    description: {
      uz: "Sutdan tayyorlangan tetiklantiruvchi nordon sut ichimligi, ta’mi yumshoq, yengil nordonlik seziladi.",
      ru: "Освежающий кисломолочный напиток из молока с мягким вкусом и лёгкой кислинкой.",
      en: "A refreshing fermented milk drink with a mild taste and a slight tang.",
    },
    flavour: { uz: "Oddiy", ru: "Обычный", en: "Plain" },
    fatPercent: 2.2,
    sizes: [grams(450, 12, ka("ayron-450g")), grams(900, 8, ka("ayron-900g"))],
    storage: KEFIR_STORAGE,
  },
  {
    id: "ka-ayron-basil",
    slug: "ayron-basil",
    category: "kefir-ayron",
    line: "musaffo",
    group: "ayron",
    tint: "basil",
    name: {
      uz: "Ayron rayhon ta’mi bilan 2,2%",
      ru: "Айран со вкусом базилика 2,2%",
      en: "Ayran with basil flavor 2.2%",
    },
    description: {
      uz: "Rayhon ta’mi qo‘shilgan an’anaviy ayron, ta’mi tetik va yorqin.",
      ru: "Традиционный айран со вкусом базилика, свежий и яркий на вкус.",
      en: "Traditional ayran with basil flavor, fresh and bright in taste.",
    },
    flavour: { uz: "Rayhon", ru: "Базилик", en: "Basil" },
    fatPercent: 2.2,
    sizes: [grams(450, 12, ka("ayron-basil-450g")), grams(900, 8, ka("ayron-basil-900g"))],
    storage: KEFIR_STORAGE,
  },
];
