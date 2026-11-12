import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/catalog/",
    title: `${dict.meta.catalogTitle} | Musaffo`,
    description: dict.meta.catalogDescription,
  });
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-black text-brand sm:text-4xl">{dict.catalog.title}</h1>
      <CatalogBrowser locale={locale} />
    </div>
  );
}
