import { lineLabels } from "@/components/LineBadge";
import { products, type Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";

/** "Aloqa | Musaffo Xorazm": every page's <title> ends with the branch's name in the page's language. */
export const pageTitle = (part: string, locale: Locale) => `${part} | ${getDictionary(locale).meta.siteName}`;

/**
 * A product's name for its title. Engil and Musaffo make products with the same name (both banana drinking yogurts
 * are "Banan bo‘lakchali ichimlik yogurt"), so where another product shares the name in this language, the line goes
 * first: "Engil — Banan bo‘lakchali ichimlik yogurt". Every product page gets a title of its own.
 */
export function productTitleName(product: Product, locale: Locale): string {
  const name = product.name[locale];
  const shared = products.some((p) => p !== product && p.name[locale] === name);
  return shared ? `${lineLabels[product.line]} — ${name}` : name;
}

export const productTitle = (product: Product, locale: Locale) => pageTitle(productTitleName(product, locale), locale);
