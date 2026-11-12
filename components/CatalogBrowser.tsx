"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { lineLabels } from "./LineBadge";
import { ProductCard } from "./ProductCard";
import { RepeatLastOrder } from "./RepeatLastOrder";
import { categories, products, type BrandLine, type CategorySlug } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatFat, plural } from "@/lib/format";
import { searchProducts } from "@/lib/search";

type Filters = { q: string; line: BrandLine | null; fat: number | null };
const EMPTY: Filters = { q: "", line: null, fat: null };

function toQuery({ q, line, fat }: Filters): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (line) params.set("line", line);
  if (fat !== null) params.set("fat", String(fat));
  return params.toString();
}

const chipClass = (active: boolean) =>
  `inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-bold transition ${
    active ? "border-brand bg-brand text-white" : "border-line bg-white text-navy hover:border-sky hover:text-brand"
  }`;

/** `category` locks the view to one category page; without it, all products are shown. */
export function CatalogBrowser({ locale, category }: { locale: Locale; category?: CategorySlug }) {
  const dict = getDictionary(locale);
  const pathname = usePathname();

  const base = useMemo(() => (category ? products.filter((p) => p.category === category) : products), [category]);
  const lineOptions = useMemo(() => (["musaffo", "engil", "immun"] as const).filter((l) => base.some((p) => p.line === l)), [base]);
  const fatOptions = useMemo(() => [...new Set(base.map((p) => p.fatPercent))].sort((a, b) => a - b), [base]);

  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filters live in the URL so they survive the back button and can be shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const line = params.get("line") as BrandLine | null;
    const fat = params.get("fat") === null ? null : Number(params.get("fat"));
    // The static HTML can't know the URL, so filters can only be read from it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters({
      q: params.get("q") ?? "",
      line: line && lineOptions.includes(line) ? line : null,
      fat: fat !== null && fatOptions.includes(fat) ? fat : null,
    });
    setReady(true);
  }, [lineOptions, fatOptions]);

  const query = toQuery(filters);
  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(window.history.state, "", query ? `${pathname}?${query}` : pathname);
  }, [query, pathname, ready]);

  const results = useMemo(() => {
    // With a search, results come in order of how well they match (lib/search.ts).
    const pool = filters.q.trim() ? searchProducts(filters.q).map((hit) => hit.product).filter((p) => base.includes(p)) : base;
    return pool.filter((p) => {
      if (filters.line && p.line !== filters.line) return false;
      if (filters.fat !== null && p.fatPercent !== filters.fat) return false;
      return true;
    });
  }, [base, filters]);

  const hasFilters = query !== "";
  const suffix = query ? `?${query}` : "";

  const toggleLine = (line: BrandLine) => setFilters((f) => ({ ...f, line: f.line === line ? null : line }));
  const toggleFat = (fat: number) => setFilters((f) => ({ ...f, fat: f.fat === fat ? null : fat }));

  return (
    <>
    <div className="mt-4 space-y-3">
      <RepeatLastOrder locale={locale} />
      <Link
        href={`/${locale}/quick/`}
        data-quick-banner
        className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-2 font-bold text-navy transition hover:bg-sky-soft/60"
      >
        <span className="text-pretty">{dict.quick.bannerText}</span>
        <span className="shrink-0 font-extrabold whitespace-nowrap text-brand">
          {dict.quick.title} <span aria-hidden="true">→</span>
        </span>
      </Link>
    </div>
    <div className="mt-5 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <label className="block">
          <span className="sr-only">{dict.catalog.searchLabel}</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder={dict.catalog.searchPlaceholder}
            className="h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-navy placeholder:font-medium placeholder:text-slate/80 focus:border-sky"
          />
        </label>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl bg-mist px-4 font-extrabold text-brand lg:hidden"
        >
          {dict.catalog.filters}
          <svg viewBox="0 0 24 24" className={`size-5 transition ${mobileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div className={`${mobileOpen ? "block" : "hidden"} mt-4 space-y-5 lg:block`}>
          <fieldset>
            <legend className="mb-2 text-sm font-extrabold text-slate">{dict.catalog.category}</legend>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/catalog/${suffix}`} aria-current={!category ? "page" : undefined} className={chipClass(!category)}>
                {dict.catalog.allCategories}
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${locale}/catalog/${c.slug}/${suffix}`}
                  aria-current={category === c.slug ? "page" : undefined}
                  className={chipClass(category === c.slug)}
                >
                  {dict.categories[c.slug]}
                </Link>
              ))}
            </div>
          </fieldset>

          {lineOptions.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-extrabold text-slate">{dict.catalog.line}</legend>
              <div className="flex flex-wrap gap-2">
                {lineOptions.map((line) => (
                  <button key={line} type="button" aria-pressed={filters.line === line} onClick={() => toggleLine(line)} className={chipClass(filters.line === line)}>
                    {lineLabels[line]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {fatOptions.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-sm font-extrabold text-slate">{dict.catalog.fat}</legend>
              <div className="flex flex-wrap gap-2">
                {fatOptions.map((fat) => (
                  <button key={fat} type="button" aria-pressed={filters.fat === fat} onClick={() => toggleFat(fat)} className={chipClass(filters.fat === fat)}>
                    {formatFat(fat, locale)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </aside>

      <section className="mt-5 lg:mt-0" aria-label={dict.catalog.title}>
        <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
          <p className="font-bold text-slate" aria-live="polite">
            {plural(locale, results.length, dict.catalog.resultCount)}
          </p>
          {hasFilters && (
            <button type="button" onClick={() => setFilters(EMPTY)} className="min-h-8 font-bold text-brand underline-offset-2 hover:underline">
              {dict.catalog.clear}
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl bg-mist px-6 py-14 text-center">
            <p className="text-xl font-extrabold text-brand">{dict.catalog.emptyTitle}</p>
            <p className="mt-2 font-semibold text-slate">{dict.catalog.emptyHint}</p>
          </div>
        )}
      </section>
    </div>
    </>
  );
}
