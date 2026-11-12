"use client";

import { useDeferredValue, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { AddToListCompact } from "./AddToList";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { categories } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatFat, formatSizes, plural, webpPath } from "@/lib/format";
import { searchCategories, searchProducts } from "@/lib/search";
import { tintStyle } from "@/lib/tints";

const MAX_RESULTS = 12;

/**
 * Search from every page: a header button (or "/" and Ctrl+K) opens a sheet with instant results,
 * and boxes can be added straight from them. Matching is in lib/search.ts.
 */
export function GlobalSearch({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.search;
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const show = () => {
    setOpen(true);
    dialog.current?.showModal();
    window.setTimeout(() => input.current?.select(), 0);
  };
  const hide = () => dialog.current?.close();

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      const shortcut = (event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k");
      if (!shortcut || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      show();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = deferred.trim() ? searchProducts(deferred) : [];
  const matchedCategories = deferred.trim() ? searchCategories(deferred) : [];
  const catalogHref = `/${locale}/catalog/?q=${encodeURIComponent(query.trim())}`;

  const onInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && hits[0]) {
      event.preventDefault();
      dialog.current?.querySelector<HTMLAnchorElement>("[data-search-result] a")?.click();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      dialog.current?.querySelector<HTMLAnchorElement>("[data-search-result] a")?.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        data-global-search
        onClick={show}
        aria-label={t.open}
        aria-keyshortcuts="/ Control+K"
        className="grid size-11 shrink-0 place-items-center rounded-full text-brand transition hover:bg-mist"
      >
        <SearchIcon className="size-6" />
      </button>

      <dialog
        ref={dialog}
        data-search-sheet
        aria-label={t.open}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the dialog element itself is a click on the backdrop.
          if (e.target === dialog.current) hide();
        }}
        className="quick-view search-sheet mx-auto mt-0 mb-auto max-h-dvh w-full max-w-none overflow-hidden rounded-b-3xl bg-white text-navy md:mt-[8vh] md:max-h-[84vh] md:max-w-2xl md:rounded-3xl"
      >
        {open && (
          <>
            <div className="flex items-center gap-2 border-b border-line p-3 sm:p-4">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t.open}</span>
                <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate" />
                <input
                  ref={input}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder={t.placeholder}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-12 w-full rounded-2xl border-2 border-line bg-white pr-3 pl-11 text-base font-semibold text-navy outline-none placeholder:font-medium placeholder:text-slate/80 focus:border-sky"
                />
              </label>
              <button type="button" onClick={hide} aria-label={dict.product.close} className="grid size-11 shrink-0 place-items-center rounded-full text-brand hover:bg-mist">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              {!deferred.trim() ? (
                <div>
                  <p className="text-sm font-semibold text-pretty text-slate">{t.hint}</p>
                  <p className="mt-4 text-sm font-extrabold text-slate">{dict.home.categoriesTitle}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/${locale}/catalog/${c.slug}/`} onClick={hide} className="inline-flex min-h-10 items-center rounded-full bg-mist px-3.5 text-sm font-extrabold text-brand hover:bg-sky-soft/60">
                          {dict.categories[c.slug]}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/${locale}/quick/`} onClick={hide} className="inline-flex min-h-10 items-center rounded-full border-2 border-brand px-3.5 text-sm font-extrabold text-brand hover:bg-mist">
                        {dict.quick.title}
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : hits.length === 0 ? (
                <div data-search-empty className="rounded-2xl bg-mist px-4 py-8 text-center">
                  <p className="text-lg font-black text-brand">{dict.catalog.emptyTitle}</p>
                  <p className="mt-1 font-semibold text-pretty text-slate">{t.emptyHint}</p>
                  <Link href={`/${locale}/catalog/`} onClick={hide} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand px-6 font-extrabold text-white hover:bg-brand-bright">
                    {dict.list.emptyCta}
                  </Link>
                </div>
              ) : (
                <>
                  {matchedCategories.length > 0 && (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {matchedCategories.map((slug) => (
                        <li key={slug}>
                          <Link href={`/${locale}/catalog/${slug}/`} onClick={hide} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-mist px-3.5 text-sm font-extrabold text-brand hover:bg-sky-soft/60">
                            {dict.categories[slug]} <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mb-2 text-sm font-extrabold text-slate" aria-live="polite">
                    {plural(locale, hits.length, dict.catalog.resultCount)}
                  </p>
                  <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                    {hits.slice(0, MAX_RESULTS).map(({ product, sizes }) => {
                      const shown = product.sizes.filter((s) => !sizes || sizes.includes(s.amount));
                      return (
                        <li key={product.id} data-search-result={product.slug} data-pack-scope className="flex items-center gap-2.5 p-2 sm:gap-3 sm:p-2.5">
                          <Link href={`/${locale}/products/${product.slug}/`} onClick={hide} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl sm:gap-3">
                            <span className="tint-tile block size-14 shrink-0 overflow-hidden rounded-xl p-1" style={tintStyle(product.tint) as CSSProperties}>
                              <img src={webpPath(shown[0].image, "shelf")} alt="" width={56} height={56} className="size-full object-contain" />
                            </span>
                            <span className="min-w-0">
                              <LineBadge line={product.line} />
                              <span className="mt-0.5 block leading-snug font-extrabold text-navy">{product.name[locale]}</span>
                              <span className="block text-xs font-bold text-slate">
                                {formatFat(product.fatPercent, locale)} · {formatSizes(product, dict)}
                              </span>
                            </span>
                          </Link>
                          <div className="w-30 shrink-0 space-y-1.5 sm:w-34">
                            {shown.map((size) => (
                              <AddToListCompact key={size.amount} product={product} size={size} locale={locale} />
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <Link href={catalogHref} onClick={hide} className="mt-3 flex min-h-11 items-center justify-center rounded-full font-extrabold text-brand hover:bg-mist">
                    {t.seeAll} <span aria-hidden="true">&nbsp;→</span>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}
