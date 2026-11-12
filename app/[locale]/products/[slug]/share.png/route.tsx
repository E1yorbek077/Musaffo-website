import { products } from "@/data/products";
import { isLocale, locales } from "@/i18n";
import { getProduct } from "@/lib/catalog";
import { productCard } from "@/lib/og";

// Share card for one product in one language, rendered at build time.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams({ params }: { params?: { locale?: string } }) {
  const forLocales = params?.locale ? [params.locale] : locales;
  return forLocales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product || !isLocale(locale)) return new Response(null, { status: 404 });
  return productCard(product, locale);
}
