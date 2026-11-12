import { isLocale, locales } from "@/i18n";
import { shelfCard } from "@/lib/og";
import { brandCardText } from "@/lib/share";

// The brand card, rendered at build time. Every page without a card of its own uses it.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** One pack from each category, matching the fridge on the home page. */
const SHELF = [
  "/products/milk/milk-3-2.png",
  "/products/kefir-ayron/kefir-1-900g.png",
  "/products/drinking-yogurt/musaffo-drinking-strawberry.png",
  "/products/drinking-yogurt/engil-drinking-peach.png",
  "/products/glazed-sirok/musaffo-sirok-cocoa.png",
  "/products/butter-qatiq/qatiq-3.png",
];

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  return shelfCard({ ...brandCardText(locale), images: SHELF });
}
