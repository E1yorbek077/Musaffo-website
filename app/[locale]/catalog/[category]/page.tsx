import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { CategoryStage } from "@/components/CategoryStage";
import { categories, type CategorySlug } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { getCategory } from "@/lib/catalog";
import { fill } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { categoryShareImage } from "@/lib/share";

type Props = { params: Promise<{ locale: Locale; category: CategorySlug }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const dict = getDictionary(locale);
  const name = dict.categories[category];
  return pageMetadata({
    locale,
    path: `/catalog/${category}/`,
    title: `${name} | Musaffo`,
    description: fill(dict.meta.categoryDescription, { category: name }),
    shareImage: categoryShareImage(locale, category),
  });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  if (!getCategory(category)) notFound();

  return (
    <>
      <CategoryStage category={category} locale={locale} />
      <div id="products" className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-10 sm:px-6">
        <CatalogBrowser locale={locale} category={category} />
      </div>
    </>
  );
}
