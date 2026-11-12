import Link from "@/components/Link";
import { branch, MAIN_BRAND_SITE, telegramHref, telHref } from "@/data/branch";
import { categories } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <footer className="mt-10 bg-linear-to-br from-brand-bright to-brand text-white print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6">
        <div>
          <img src="/brand/logo.svg" alt="Musaffo" width={138} height={43} loading="lazy" className="h-11 w-auto" />
          {/* The Khorezm branch's own contacts first (data/branch.ts; empty ones aren't shown), then the brand. */}
          <p className="mt-4 font-black">{dict.meta.siteName}</p>
          {(branch.phone || branch.telegram || branch.address[locale]) && (
            <ul className="mt-1 space-y-1 font-semibold text-white/90" data-footer-branch>
              {branch.phone && (
                <li>
                  <a href={telHref(branch.phone)} className="hover:underline">
                    {branch.phone}
                  </a>
                </li>
              )}
              {branch.telegram && (
                <li>
                  <a href={telegramHref(branch.telegram)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Telegram: @{branch.telegram.replace(/^@/, "")}
                  </a>
                </li>
              )}
              {branch.address[locale] && <li>{branch.address[locale]}</li>}
            </ul>
          )}
          <p className="mt-4 font-semibold text-white/85">{dict.footer.producer}</p>
          <p className="mt-1 font-semibold text-white/85">
            {dict.footer.mainSite}:{" "}
            <a href={MAIN_BRAND_SITE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              {MAIN_BRAND_SITE.label}
            </a>
          </p>
        </div>
        <nav aria-label={dict.footer.categories}>
          <h2 className="font-extrabold">{dict.footer.categories}</h2>
          <ul className="mt-3 space-y-1.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${locale}/catalog/${c.slug}/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                  {dict.categories[c.slug]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={dict.footer.pages}>
          <h2 className="font-extrabold">{dict.footer.pages}</h2>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href={`/${locale}/catalog/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.nav.catalog}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/quick/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.quick.title}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/orders/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.orders.title}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/labels/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.labels.entry}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.nav.about}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contacts/`} className="font-semibold text-white/85 hover:text-white hover:underline">
                {dict.nav.contacts}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
