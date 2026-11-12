import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { AppRuntime } from "@/components/AppRuntime";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OrderBar } from "@/components/OrderBar";
import { isLocale, locales } from "@/i18n";
import "../globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-nunito",
  display: "swap",
});

export const dynamicParams = false;

export const viewport: Viewport = { themeColor: "#005aaa" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={nunito.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <Header locale={locale} />
        <AppRuntime locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <OrderBar locale={locale} />
      </body>
    </html>
  );
}
