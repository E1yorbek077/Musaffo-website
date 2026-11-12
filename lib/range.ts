import { categories, products, type CategorySlug, type Product, type Tint } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatDecimal, formatFat, formatSize, plural } from "./format";

/**
 * How each category is presented: its colour world, its packs' shape, and figures computed from data/products.ts.
 * Used by the home page range (components/RangeShowcase.tsx) and the category pages (components/CategoryStage.tsx).
 */

/** Each category's colour world: the flavour most typical of it. */
export const LEAD: Record<CategorySlug, Tint> = {
  "drinking-yogurt": "strawberry",
  "thick-yogurt": "peach",
  "glazed-sirok": "cocoa",
  milk: "meadow",
  "butter-qatiq": "butter",
  "kefir-ayron": "lagoon",
};

/** Width of one pack in a fan, by pack shape: bottles and bars are narrow, cups and the butter block wide. */
export const PACK_W: Record<CategorySlug, string> = {
  "drinking-yogurt": "clamp(4.5rem, 13vw, 8.5rem)",
  "thick-yogurt": "clamp(8rem, 22vw, 15rem)",
  "glazed-sirok": "clamp(4.25rem, 11vw, 7rem)",
  milk: "clamp(6rem, 17vw, 10.5rem)",
  "butter-qatiq": "clamp(10rem, 30vw, 19rem)",
  "kefir-ayron": "clamp(4.5rem, 14vw, 9rem)",
};

/** Width ÷ height of the packshots (measured from the WebP files), so each pack's space is reserved before it loads. */
export const PACK_RATIO: Record<CategorySlug, number> = {
  "drinking-yogurt": 0.34,
  "thick-yogurt": 1.77,
  "glazed-sirok": 0.37,
  milk: 0.38,
  "butter-qatiq": 1.3,
  "kefir-ayron": 0.36,
};

const MAX_PACKS = 5;

export const productsOf = (slug: CategorySlug) => products.filter((p) => p.category === slug);

/**
 * Up to five packs that show the range: one from each line in turn, different flavours first. The first pick stands
 * in the middle of the fan, the next ones alternate to its sides.
 */
export function fanOf(list: Product[]): Product[] {
  const groups = [...new Set(list.map((p) => p.group))].map((g) => list.filter((p) => p.group === g));
  const roundRobin: Product[] = [];
  for (let i = 0; roundRobin.length < list.length; i++) groups.forEach((g) => g[i] && roundRobin.push(g[i]));
  const picked: Product[] = [];
  const tints = new Set<Tint>();
  for (const p of roundRobin) if (picked.length < MAX_PACKS && !tints.has(p.tint)) (picked.push(p), tints.add(p.tint));
  for (const p of roundRobin) if (picked.length < MAX_PACKS && !picked.includes(p)) picked.push(p);
  // [0, 1, 2, 3, 4] → [3, 1, 0, 2, 4]: the first pick in the centre.
  const arranged: Product[] = [];
  picked.forEach((p, i) => (i % 2 === 1 ? arranged.unshift(p) : arranged.push(p)));
  return arranged;
}

/**
 * The flavour ("Banan") under its line badge. Where one line has two product kinds with variant labels (kefir and
 * ayron), a label like "Oddiy" means nothing on its own, so the product name is used instead.
 */
export function chipLabel(p: Product, list: Product[], locale: Locale): string {
  const mixedKinds = new Set(list.filter((x) => x.line === p.line).map((x) => x.group)).size > 1;
  if (mixedKinds && p.flavour) return p.name[locale];
  return p.flavour?.[locale] ?? p.short?.[locale] ?? p.name[locale];
}

/** Assortment, fat and sizes of a category, as label/value pairs. */
export function rangeFacts(slug: CategorySlug, locale: Locale) {
  const dict = getDictionary(locale);
  const t = dict.range;
  const list = productsOf(slug);
  const variantKind = categories.find((c) => c.slug === slug)?.variantKind;
  const fats = [...new Set(list.map((p) => p.fatPercent))].sort((a, b) => a - b);
  // Two values are two products (butter 82,5%, qatiq 3%), not a range; three or more read as one.
  const fat = fats.length <= 2 ? fats.map((f) => formatFat(f, locale)).join(" · ") : `${formatDecimal(fats[0], locale)}–${formatFat(fats.at(-1)!, locale)}`;
  const sizes = [...new Map(list.flatMap((p) => p.sizes).sort((a, b) => a.amount - b.amount).map((s) => [`${s.amount}${s.unit}`, s])).values()];
  return [
    { label: t.assortment, value: plural(locale, list.length, variantKind === "flavour" ? t.flavours : t.kinds) },
    { label: dict.catalog.fat, value: fat },
    { label: dict.product.size, value: sizes.map((s) => formatSize(s, dict)).join(" · ") },
  ];
}

/**
 * srcset for a packshot: the 480 px thumbnail and the 900 px stage file (both sized on their long side), so a phone
 * with a dense screen gets the sharp one and a desktop the light one.
 */
export function packSrcSet(image: string, slug: CategorySlug): string {
  const ratio = PACK_RATIO[slug];
  const width = (long: number) => Math.round(ratio < 1 ? long * ratio : long);
  const webp = (kind: string) => image.replace(/\.png$/, `.${kind}.webp`);
  return `${webp("thumb")} ${width(480)}w, ${webp("stage")} ${width(900)}w`;
}
