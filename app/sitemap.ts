import type { MetadataRoute } from "next";
import { categories, products } from "@/data/products";
import { defaultLocale, locales } from "@/i18n";
import { SITE_URL } from "@/lib/catalog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/catalog/",
    "/about/",
    "/contacts/",
    ...categories.map((c) => `/catalog/${c.slug}/`),
    ...products.map((p) => `/products/${p.slug}/`),
  ];
  return paths.flatMap((path) => {
    const languages = {
      ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      "x-default": `${SITE_URL}/${defaultLocale}${path}`,
    };
    return locales.map((locale) => ({ url: `${SITE_URL}/${locale}${path}`, alternates: { languages } }));
  });
}
