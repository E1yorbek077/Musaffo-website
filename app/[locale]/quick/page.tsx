import type { Metadata } from "next";
import { QuickOrder } from "@/components/QuickOrder";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { pageTitle } from "@/lib/titles";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { quick } = getDictionary(locale);
  return {
    ...pageMetadata({
      locale,
      path: "/quick/",
      title: pageTitle(quick.title, locale),
      description: quick.hint,
    }),
    // A working tool: product and catalog pages are what should appear in search results.
    robots: { index: false, follow: true },
  };
}

export default async function QuickOrderPage({ params }: Props) {
  const { locale } = await params;
  return <QuickOrder locale={locale} />;
}
