import type { Metadata } from "next";
import { OrdersPage } from "@/components/OrdersPage";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    ...pageMetadata({ locale, path: "/orders/", title: `${dict.orders.title} | Musaffo`, description: dict.orders.intro }),
    // Personal and stored only in the visitor's browser: nothing for search results.
    robots: { index: false, follow: true },
  };
}

export default async function Orders({ params }: Props) {
  const { locale } = await params;
  return <OrdersPage locale={locale} />;
}
