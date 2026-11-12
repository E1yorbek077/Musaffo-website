import { categories, products, type CategorySlug, type Product } from "@/data/products";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.musaffo.uz").replace(/\/$/, "");

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function productsInCategory(slug: CategorySlug): Product[] {
  return products.filter((p) => p.category === slug);
}

/** Other flavours/variants of a product, including itself, in catalog order. */
export function variantsOf(product: Product): Product[] {
  return products.filter((p) => p.group === product.group);
}
