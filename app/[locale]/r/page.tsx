import type { Metadata } from "next";
import { ScanAdd } from "@/components/ScanAdd";
import { getDictionary, type Locale } from "@/i18n";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // Opened from a QR code on a shop's shelf label: a working page, nothing for search engines.
  return { title: `${getDictionary(locale).scan.title} | Musaffo`, robots: { index: false, follow: false } };
}

export default async function ScanPage({ params }: Props) {
  const { locale } = await params;
  return <ScanAdd locale={locale} />;
}
