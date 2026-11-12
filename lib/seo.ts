import type { Metadata } from "next";
import { defaultLocale, getDictionary, locales, type Locale } from "@/i18n";
import { brandShareImage, type ShareImage } from "./share";
import { siteUrl } from "./site-url";

const OG_LOCALES: Record<Locale, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

/**
 * Canonical + hreflang + Open Graph for a page that exists in both languages.
 * `path` is the part after the locale, with leading and trailing slash: "/catalog/".
 */
export function pageMetadata(opts: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** The page's share card. Pages without one of their own get the brand card. */
  shareImage?: ShareImage;
}): Metadata {
  const { locale, path, title, description } = opts;
  const share = opts.shareImage ?? brandShareImage(locale);
  const images = [{ url: share.url, alt: share.alt, width: 1200, height: 630, type: "image/png" }];
  const base = siteUrl();
  const url = (l: Locale) => `${base}/${l}${path}`;
  const siteName = getDictionary(locale).meta.siteName;
  return {
    metadataBase: new URL(base),
    title,
    description,
    manifest: `/manifest-${locale}.webmanifest`,
    appleWebApp: { capable: true, title: siteName, statusBarStyle: "default" },
    alternates: {
      canonical: url(locale),
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, url(l)])),
        "x-default": url(defaultLocale),
      },
    },
    openGraph: {
      title,
      description,
      url: url(locale),
      siteName,
      locale: OG_LOCALES[locale],
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
