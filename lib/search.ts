import { categories, products, type CategorySlug, type Product } from "@/data/products";

/**
 * Product search that copes with how people in Uzbekistan actually type:
 *  - Uzbek in Latin or Cyrillic, Russian in Cyrillic or Latin letters: all are folded to one spelling
 *  - typos and word endings (молако, kefr, клубничный)
 *  - sizes and fat ("kefir 900", "sut 3,2", "1%")
 * Everything runs in the browser over data/products.ts, so new products are searchable by themselves.
 */

/* ───────── Folding text to one spelling ───────── */

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
  ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  // Uzbek Cyrillic
  ў: "o", қ: "k", ғ: "g", ҳ: "h",
};

/** Lower case, Cyrillic to Latin, no apostrophes, and the letters people swap folded together. */
export function fold(text: string): string {
  let out = "";
  for (const ch of text.toLowerCase()) out += CYRILLIC[ch] ?? ch;
  return out
    .replace(/[ʻʼ’‘`´']/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/q/g, "k")
    .replace(/x/g, "h")
    .replace(/gh/g, "g")
    .replace(/[^a-z0-9.%]+/g, " ")
    .trim();
}

const STOP = new Set(["s", "i", "va", "and", "with", "bilan", "of", "the", "dlya", "so", "ta", "v", "na", "in"]);

const tokens = (text: string) => fold(text).split(" ").filter((t) => t && !STOP.has(t) && (t.length > 1 || /\d/.test(t)));

/* ───────── Extra words people use that aren't in the product names ───────── */

/**
 * Words true of every product in the category, so they count as the products' own words.
 * Category names don't: "Kefir va ayron" isn't true of ayron.
 */
const CATEGORY_WORDS: Record<CategorySlug, string> = {
  "drinking-yogurt": "ichimlik питьевой пить drinking drinkable",
  "thick-yogurt": "quyuq густой thick spoonable стаканчик",
  "glazed-sirok": "sirok сырок curd творог tvorog glazed глазированный glazurlangan",
  milk: "sut молоко milk",
  "butter-qatiq": "",
  "kefir-ayron": "кисломолочный nordon fermented",
};

const TINT_WORDS: Partial<Record<Product["tint"], string>> = {
  cocoa: "shokolad шоколад chocolate",
};

/* ───────── Index ───────── */

type Field = { token: string; weight: number; primary: boolean };
type Entry = { product: Product; order: number; words: Field[]; numbers: { token: string; size?: number; fat?: boolean }[] };

const LOCALES = ["uz", "ru", "en"] as const;
const lineWords: Record<Product["line"], string> = { musaffo: "musaffo", engil: "engil", immun: "immun+ immun" };

const add = (list: Field[], text: string, weight: number, primary: boolean) => {
  for (const token of tokens(text)) if (!/\d/.test(token)) list.push({ token, weight, primary });
};

// Category names come from the i18n files; only the words are needed here, so they're inlined at module load.
import en from "@/i18n/en.json";
import ru from "@/i18n/ru.json";
import uz from "@/i18n/uz.json";
const CATEGORY_NAMES = (slug: CategorySlug) => [uz, ru, en].map((d) => d.categories[slug]).join(" ");

const INDEX: Entry[] = products.map((product, order) => {
  const words: Field[] = [];
  for (const l of LOCALES) {
    add(words, product.name[l], 1, true);
    if (product.flavour) add(words, product.flavour[l], 1.2, true);
    if (product.short) add(words, product.short[l], 1, true);
  }
  add(words, lineWords[product.line], 0.8, true);
  add(words, TINT_WORDS[product.tint] ?? "", 0.9, true);
  add(words, CATEGORY_WORDS[product.category], 0.7, true);
  add(words, CATEGORY_NAMES(product.category), 0.6, false);
  const fat = String(product.fatPercent);
  const numbers = [
    { token: `${fat}%`, fat: true },
    { token: fat, fat: true },
    ...product.sizes.flatMap((s) => [
      { token: String(s.amount), size: s.amount },
      { token: `${s.amount}${fold(s.unit)}`, size: s.amount },
    ]),
  ];
  return { product, order, words, numbers };
});

/* ───────── Matching ───────── */

/** Optimal string alignment distance, giving up early once it can't be within `max`. */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}

const commonPrefix = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

/** How well one typed word matches one indexed word, from 0 to 1. */
function wordScore(typed: string, word: string): number {
  if (typed === word) return 1;
  if (typed.length >= 2 && word.startsWith(typed)) return 0.9; // still typing
  const prefix = commonPrefix(typed, word);
  if (prefix >= 5 && prefix >= 0.6 * Math.min(typed.length, word.length)) return 0.8; // клубничный ~ клубники
  if (typed.length >= 4) {
    const max = typed.length >= 7 ? 2 : 1;
    if (distance(typed, word, max) <= max) return 0.7; // typo
  }
  return 0;
}

export type SearchHit = {
  product: Product;
  score: number;
  /** Only these sizes, when the query named one ("kefir 900"); null for all of them. */
  sizes: number[] | null;
};

/** Ranked products matching every word of the query. An empty query matches nothing. */
export function searchProducts(query: string): SearchHit[] {
  const typed = tokens(query);
  if (typed.length === 0) return [];

  // For each typed word: each product's best match, and whether it came from the product itself.
  const perWord = typed.map((t) =>
    INDEX.map((entry) => {
      if (/\d/.test(t)) {
        const hits = entry.numbers.filter((n) => n.token === t && (!t.endsWith("%") || n.fat));
        const sizes = hits.flatMap((n) => (n.size ? [n.size] : []));
        return { score: hits.length ? 1 : 0, primary: true, sizes: hits.some((n) => n.fat) ? null : sizes };
      }
      let score = 0;
      let primary = false;
      let quality = 0;
      for (const w of entry.words) {
        const q = wordScore(t, w.token);
        const s = q * w.weight;
        if (s > score || (s === score && w.primary)) {
          score = s;
          primary = w.primary;
          quality = q;
        }
      }
      return { score, primary, quality, sizes: null as number[] | null };
    }),
  );

  for (const scores of perWord) {
    // A word that names products directly ("kefir") shouldn't also pull in everything in their category
    // ("Kefir va ayron"). The category name only counts when nothing matches the word directly.
    if (scores.some((s) => s.score > 0 && s.primary)) for (const s of scores) if (!s.primary) s.score = 0;
    // When a word matches some products exactly or as a beginning ("ananas"), near-misses are noise:
    // "ananas" must not also find "an’anaviy" butter. Typos and word endings still work when nothing matches exactly.
    if (scores.some((s) => s.score > 0 && (s.quality ?? 1) >= 0.9)) for (const s of scores) if ((s.quality ?? 1) < 0.9) s.score = 0;
  }

  const hits: (SearchHit & { order: number })[] = [];
  INDEX.forEach((entry, i) => {
    const parts = perWord.map((scores) => scores[i]);
    if (parts.some((p) => p.score === 0)) return;
    const sizeSets = parts.map((p) => p.sizes).filter((s): s is number[] => s !== null && s.length > 0);
    const sizes = sizeSets.length ? entry.product.sizes.map((s) => s.amount).filter((a) => sizeSets.every((set) => set.includes(a))) : null;
    if (sizes && sizes.length === 0) return;
    hits.push({ product: entry.product, score: parts.reduce((sum, p) => sum + p.score, 0), sizes, order: entry.order });
  });
  return hits.sort((a, b) => b.score - a.score || a.order - b.order).map(({ product, score, sizes }) => ({ product, score, sizes }));
}

/** Categories whose names match the query, for quick links in the search sheet. */
export function searchCategories(query: string): CategorySlug[] {
  const typed = tokens(query).filter((t) => !/\d/.test(t));
  if (typed.length === 0) return [];
  return categories
    .map((c) => c.slug)
    .filter((slug) => {
      const words = tokens(`${CATEGORY_NAMES(slug)} ${CATEGORY_WORDS[slug]}`);
      return typed.every((t) => words.some((w) => wordScore(t, w) > 0));
    });
}
