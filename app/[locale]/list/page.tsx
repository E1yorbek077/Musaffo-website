import type { Metadata } from "next";
import { OrderListPage } from "@/components/OrderListPage";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { pageTitle } from "@/lib/titles";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    ...pageMetadata({
      locale,
      path: "/list/",
      title: pageTitle(dict.list.title, locale),
      description: dict.list.emptyHint,
    }),
    // A personal list has no value in search results.
    robots: { index: false, follow: true },
  };
}

export default async function ListPage({ params }: Props) {
  const { locale } = await params;
  return <OrderListPage locale={locale} />;
}
