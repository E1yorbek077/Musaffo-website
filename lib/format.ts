import type { Dictionary, Locale } from "@/i18n";
import type { Product, ProductSize, StorageRule } from "@/data/products";

/** Fills {placeholders} in an i18n string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

type PluralForms = { other: string; one?: string; few?: string; many?: string };

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count) as keyof PluralForms;
  return fill(forms[rule] ?? forms.other, { count });
}

/** Uzbek and Russian write decimals with a comma, as the catalog does: 3,2%. English uses a point: 3.2% */
export function formatDecimal(value: number, locale: Locale): string {
  return locale === "en" ? String(value) : String(value).replace(".", ",");
}

export function formatFat(fat: number, locale: Locale): string {
  return `${formatDecimal(fat, locale)}%`;
}

export function formatSize(size: ProductSize, dict: Dictionary): string {
  return `${size.amount} ${dict.units[size.unit]}`;
}

/** "450 / 900 g" */
export function formatSizes(product: Product, dict: Dictionary): string {
  const unit = dict.units[product.sizes[0].unit];
  return `${product.sizes.map((s) => s.amount).join(" / ")} ${unit}`;
}

export function formatShelfLife(rule: StorageRule, locale: Locale, dict: Dictionary): string {
  const forms: PluralForms = dict.units[rule.shelfLife.unit];
  return plural(locale, rule.shelfLife.value, forms);
}

/** Derives the WebP path made by scripts/optimize-images.mjs from a PNG path. */
export function webpPath(png: string, kind: "stage" | "thumb" | "shelf"): string {
  return png.replace(/\.png$/, `.${kind}.webp`);
}
