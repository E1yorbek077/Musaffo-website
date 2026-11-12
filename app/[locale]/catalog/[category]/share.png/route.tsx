import { categories, type CategorySlug } from "@/data/products";
import { isLocale, locales } from "@/i18n";
import { productsInCategory } from "@/lib/catalog";
import { shelfCard } from "@/lib/og";
import { categoryCardText } from "@/lib/share";

// Share card for one category in one language, rendered at build time.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams({ params }: { params?: { locale?: string } }) {
  const forLocales = params?.locale ? [params.locale] : locales;
  return forLocales.flatMap((locale) => categories.map((c) => ({ locale, category: c.slug })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category: slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category || !isLocale(locale)) return new Response(null, { status: 404 });
  return shelfCard({ eyebrow: "Musaffo", ...categoryCardText(locale, category.slug), images: shelfImages(category.slug, category.images) });
}

/** The category's own card images, topped up with other flavours: 4 packs, or 3 for wide cups. */
function shelfImages(slug: CategorySlug, preferred: string[]) {
  const images = [...preferred];
  const wide = slug === "thick-yogurt" || slug === "butter-qatiq";
  const cap = wide ? 3 : 4;
  const usedTints = new Set(productsInCategory(slug).filter((p) => p.sizes.some((s) => images.includes(s.image))).map((p) => p.tint));
  for (const product of productsInCategory(slug)) {
    if (images.length >= cap) break;
    const image = product.sizes[0].image;
    if (images.includes(image) || usedTints.has(product.tint)) continue;
    images.push(image);
    usedTints.add(product.tint);
  }
  // Catalog order, so milk reads 1%, 2%, 3.2%, 4%.
  const order = productsInCategory(slug).flatMap((p) => p.sizes.map((s) => s.image));
  return images.slice(0, cap).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
