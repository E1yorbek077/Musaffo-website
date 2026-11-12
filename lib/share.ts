import { categories, products, type CategorySlug, type Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatFat, formatSizes, plural } from "./format";

/**
 * Where each page's share card lives and its alt text. Kept apart from lib/og.tsx so page
 * metadata can use it without loading the image renderer and its fonts.
 *
 * Cards are served as .png routes: Next doesn't add the site's trailing slash to paths with a
 * file extension, so crawlers get the image straight away instead of a redirect first.
 */

export type ShareImage = { url: string; alt: string };

const CATEGORY_COUNT: Record<Locale, { one?: string; few?: string; many?: string; other: string }> = {
  uz: { other: "{count} ta toifa" },
  ru: { one: "{count} категория", few: "{count} категории", many: "{count} категорий", other: "{count} категории" },
  en: { one: "{count} category", other: "{count} categories" },
};

export function brandCardText(locale: Locale) {
  const dict = getDictionary(locale);
  const count = plural(locale, products.length, dict.catalog.resultCount);
  return { title: dict.home.heroTitle, subtitle: `${count} · ${plural(locale, categories.length, CATEGORY_COUNT[locale])}` };
}

export function categoryCardText(locale: Locale, slug: CategorySlug) {
  const dict = getDictionary(locale);
  return {
    title: dict.categories[slug],
    subtitle: plural(locale, products.filter((p) => p.category === slug).length, dict.catalog.resultCount),
  };
}

/** Name, fat and sizes. The fat is left out when the name already includes it. */
export function productCardAlt(product: Product, locale: Locale) {
  const name = product.name[locale];
  const fat = formatFat(product.fatPercent, locale);
  return [name, name.includes(fat) ? null : fat, formatSizes(product, getDictionary(locale))].filter(Boolean).join(", ");
}

export function brandShareImage(locale: Locale): ShareImage {
  const t = brandCardText(locale);
  return { url: `/${locale}/share.png`, alt: `Musaffo: ${t.title}, ${t.subtitle}` };
}

export function categoryShareImage(locale: Locale, slug: CategorySlug): ShareImage {
  const t = categoryCardText(locale, slug);
  return { url: `/${locale}/catalog/${slug}/share.png`, alt: `Musaffo: ${t.title}, ${t.subtitle}` };
}

export function productShareImage(locale: Locale, product: Product): ShareImage {
  return { url: `/${locale}/products/${product.slug}/share.png`, alt: productCardAlt(product, locale) };
}
