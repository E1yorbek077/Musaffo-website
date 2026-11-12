"use client";

import Link from "@/components/Link";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary, localeNames, locales, localeShort, type Locale } from "@/i18n";

const swapLocale = (path: string, locale: Locale) => {
  const rest = path.split("/").slice(2).filter(Boolean).join("/");
  return `/${locale}/${rest ? `${rest}/` : ""}`;
};

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const dict = getDictionary(locale);

  return (
    <div role="group" aria-label={dict.nav.language} className="flex rounded-full bg-mist p-1">
      {locales.map((l) => {
        // Read the live URL when used: the product stage changes it without a navigation, and
        // catalog filters and shared lists live in the query string.
        const liveTarget = () => swapLocale(window.location.pathname, l) + window.location.search + window.location.hash;
        return (
          <Link
            key={l}
            href={swapLocale(pathname, l)}
            lang={l}
            hrefLang={l}
            title={localeNames[l]}
            aria-current={l === locale ? "true" : undefined}
            // Covers Ctrl-click and middle-click, which the browser handles from the attribute.
            onPointerDown={(event) => event.currentTarget.setAttribute("href", liveTarget())}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey) return;
              event.preventDefault();
              router.push(liveTarget());
            }}
            className={`grid h-9 min-w-9 place-items-center rounded-full px-1.5 text-sm font-extrabold transition sm:min-w-10 sm:px-2 ${
              l === locale ? "bg-brand text-white" : "text-brand hover:bg-white"
            }`}
          >
            {localeShort[l]}
          </Link>
        );
      })}
    </div>
  );
}
