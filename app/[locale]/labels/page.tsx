import type { Metadata } from "next";
import { PriceLabels } from "@/components/PriceLabels";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { labels } = getDictionary(locale);
  return {
    ...pageMetadata({
      locale,
      path: "/labels/",
      title: `${labels.title} | Musaffo`,
      description: labels.metaDescription,
    }),
    // A working tool for shops: product and catalog pages are what should appear in search results.
    robots: { index: false, follow: true },
  };
}

export default async function LabelsPage({ params }: Props) {
  const { locale } = await params;
  return <PriceLabels locale={locale} />;
}
