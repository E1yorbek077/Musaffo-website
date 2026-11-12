import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
import { defaultLocale, getDictionary, locales } from "@/i18n";
import { pageTitle } from "@/lib/titles";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = { title: pageTitle("404", defaultLocale), robots: { index: false } };

// The static 404 page can't know the visitor's language, so it shows all of them.
export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={nunito.variable}>
      <body className="grid min-h-dvh place-items-center bg-linear-to-br from-mist to-white px-4 text-center font-sans antialiased">
        <main>
          <img src="/brand/logo.svg" alt="Musaffo" width={138} height={43} className="mx-auto h-14 w-auto" />
          <p className="mt-6 text-6xl font-black text-brand">404</p>
          {locales.map((locale, i) => {
            const text = getDictionary(locale).notFound;
            return i === 0 ? (
              <h1 key={locale} className="mt-3 text-2xl font-extrabold text-navy">
                {text.title}
              </h1>
            ) : (
              <p key={locale} lang={locale} className="mt-1 text-lg font-semibold text-slate">
                {text.title}
              </p>
            );
          })}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {locales.map((locale, i) => (
              <Link
                key={locale}
                lang={locale}
                href={`/${locale}/catalog/`}
                prefetch={false}
                className={`inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 font-extrabold ${
                  i === 0 ? "bg-brand text-white hover:bg-brand-bright" : "text-brand hover:bg-mist"
                }`}
              >
                {getDictionary(locale).notFound.back}
              </Link>
            ))}
          </div>
        </main>
      </body>
    </html>
  );
}
