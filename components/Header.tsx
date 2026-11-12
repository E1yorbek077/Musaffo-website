"use client";

import Link from "@/components/Link";
import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { categories } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { useOrderList } from "@/lib/order-list";

export function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const boxes = useOrderList().reduce((sum, line) => sum + line.qty, 0);
  const listHref = `/${locale}/list/`;
  const quickHref = `/${locale}/quick/`;

  const navLinks = [
    { href: `/${locale}/`, label: dict.nav.home },
    { href: `/${locale}/catalog/`, label: dict.nav.catalog },
    { href: `/${locale}/about/`, label: dict.nav.about },
    { href: `/${locale}/contacts/`, label: dict.nav.contacts },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link href={`/${locale}/`} onClick={close} className="shrink-0" aria-label="Musaffo">
          <img src="/brand/logo.svg" alt="Musaffo" width={138} height={43} className="h-7 w-auto min-[360px]:h-8 sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={dict.nav.menu}>
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              // Between tablet and desktop widths there's no room for Home: the logo links there anyway.
              className={`rounded-full px-2.5 py-2 font-bold whitespace-nowrap text-navy transition hover:bg-mist hover:text-brand lg:px-4 ${i === 0 ? "hidden lg:block" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          {/* On narrower screens there's no room, and the catalog links to it instead. */}
          <Link href={quickHref} className="hidden rounded-full px-4 py-2 font-bold whitespace-nowrap text-brand transition hover:bg-mist xl:block">
            {dict.quick.title}
          </Link>
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-2">
          <GlobalSearch locale={locale} />
          <Link
            href={listHref}
            aria-label={boxes > 0 ? `${dict.list.title}: ${boxes}` : dict.list.title}
            className="relative hidden size-11 place-items-center rounded-full text-brand transition hover:bg-mist md:grid"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 4h6v3H9z" />
              <path d="M9 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H15" />
              <path d="M9 12h6M9 16h6" />
            </svg>
            {boxes > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-leaf-dark px-1 text-xs font-black text-white">
                {boxes}
              </span>
            )}
          </Link>
          <LanguageSwitcher locale={locale} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={dict.nav.menu}
            className="grid size-11 place-items-center rounded-full text-brand hover:bg-mist md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-4 py-3 md:hidden" aria-label={dict.nav.menu}>
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close} className="block rounded-xl px-3 py-3 font-extrabold text-navy hover:bg-mist">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={quickHref} onClick={close} className="block rounded-xl px-3 py-3 font-extrabold text-brand hover:bg-mist">
                {dict.quick.title}
              </Link>
            </li>
            <li>
              <Link href={listHref} onClick={close} className="flex items-center justify-between rounded-xl px-3 py-3 font-extrabold text-navy hover:bg-mist">
                {dict.list.title}
                {boxes > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-leaf-dark px-1.5 text-sm font-black text-white">{boxes}</span>}
              </Link>
            </li>
          </ul>
          <ul className="mt-2 grid grid-cols-1 gap-1 border-t border-line pt-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${locale}/catalog/${c.slug}/`}
                  onClick={close}
                  className="block rounded-xl px-3 py-2.5 font-semibold text-slate hover:bg-mist"
                >
                  {dict.categories[c.slug]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
