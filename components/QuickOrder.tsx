"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { PasteOrder } from "./PasteOrder";
import { RepeatLastOrder } from "./RepeatLastOrder";
import { categories, products, type Product, type ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSize, plural, webpPath } from "@/lib/format";
import { searchProducts } from "@/lib/search";
import { setQty, useOrderList } from "@/lib/order-list";
import { tintStyle } from "@/lib/tints";

type Row = { product: Product; size: ProductSize };
type Group = { id: string; product: Product; rows: Row[] };

/** Every product and size, built from data/products.ts, so new products appear here by themselves. */
const SECTIONS = categories.map((category) => {
  const groups: Group[] = [];
  for (const product of products.filter((p) => p.category === category.slug)) {
    let group = groups.find((g) => g.id === product.group);
    if (!group) {
      group = { id: product.group, product, rows: [] };
      groups.push(group);
    }
    for (const size of product.sizes) group.rows.push({ product, size });
  }
  return { category, groups };
});

const same = <T,>(values: T[]) => values.every((v) => v === values[0]);

export function QuickOrder({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.quick;
  const lines = useOrderList();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(SECTIONS[0].category.slug);
  const tabs = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    // Same search as everywhere else (lib/search.ts). A size in the query ("kefir 900") keeps only that size's row.
    const hits = query.trim() ? new Map(searchProducts(query).map((hit) => [hit.product.slug, hit.sizes])) : null;
    const shows = (row: Row) => {
      if (!hits) return true;
      if (!hits.has(row.product.slug)) return false;
      const sizes = hits.get(row.product.slug);
      return !sizes || sizes.includes(row.size.amount);
    };
    return SECTIONS.map((section) => {
      const groups = section.groups
        .map((group) => ({
          ...group,
          // Filtering keeps the group's shared details in its heading, based on all of its rows.
          allRows: group.rows,
          rows: group.rows.filter(shows),
        }))
        .filter((group) => group.rows.length > 0);
      return { ...section, groups };
    }).filter((section) => section.groups.length > 0);
  }, [query]);

  // Highlights the category currently on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id.replace("quick-", ""));
      },
      { rootMargin: "-140px 0px -70% 0px" },
    );
    document.querySelectorAll("[data-quick-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    const row = tabs.current;
    const tab = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !tab) return;
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const qtyOf = (row: Row) => lines.find((l) => l.slug === row.product.slug && l.amount === row.size.amount)?.qty ?? 0;

  return (
    <div data-quick-order className="pb-6">
      <div className="mx-auto max-w-3xl px-3 pt-6 sm:px-6 sm:pt-8">
        <h1 className="text-3xl font-black text-brand sm:text-4xl">{t.title}</h1>
        <p className="mt-1 font-semibold text-pretty text-slate">{t.hint}</p>
        <div className="mt-4 space-y-3">
          <PasteOrder locale={locale} />
          <RepeatLastOrder locale={locale} />
          <label className="block">
            <span className="sr-only">{dict.catalog.searchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.catalog.searchPlaceholder}
              className="h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-navy placeholder:font-medium placeholder:text-slate/80 focus:border-sky"
            />
          </label>
        </div>
      </div>

      <nav aria-label={dict.catalog.category} className="quick-tabs sticky top-16 z-20 mt-3 border-b border-line bg-white/95 backdrop-blur print:hidden">
        <div ref={tabs} className="stage-chips relative mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-3 py-2 sm:px-6 md:flex-wrap md:overflow-visible">
          {visible.map(({ category }) => (
            <a
              key={category.slug}
              href={`#quick-${category.slug}`}
              aria-current={active === category.slug ? "true" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm font-extrabold whitespace-nowrap transition ${
                active === category.slug ? "bg-brand text-white" : "bg-mist text-brand"
              }`}
            >
              {dict.categories[category.slug]}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-3 sm:px-6">
        {visible.length === 0 && (
          <div className="mt-6 rounded-3xl bg-mist px-6 py-14 text-center">
            <p className="text-xl font-extrabold text-brand">{dict.catalog.emptyTitle}</p>
            <p className="mt-2 font-semibold text-slate">{dict.catalog.emptyHint}</p>
          </div>
        )}
        {visible.map(({ category, groups }) => (
          <section key={category.slug} id={`quick-${category.slug}`} data-quick-section aria-labelledby={`quick-title-${category.slug}`} className="scroll-mt-32 pt-5">
            <h2 id={`quick-title-${category.slug}`} className="text-xl font-black text-navy">
              {dict.categories[category.slug]}
            </h2>
            {groups.map((group) => {
              const all = group.allRows;
              const sharedFat = same(all.map((r) => r.product.fatPercent));
              const sharedSize = same(all.map((r) => r.size.amount));
              const sharedBox = same(all.map((r) => r.size.piecesPerBox));
              const heading = [
                sharedFat && formatFat(group.product.fatPercent, locale),
                sharedSize && formatSize(group.rows[0].size, dict),
                sharedBox && fill(dict.list.perBox, { count: group.rows[0].size.piecesPerBox }),
              ].filter(Boolean);
              return (
                <div key={group.id} className="mt-2 overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-mist/60 px-3 py-1.5">
                    <LineBadge line={group.product.line} />
                    <span className="text-sm font-bold text-slate">{heading.join(" · ")}</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {group.rows.map((row) => (
                      <SheetRow
                        key={`${row.product.slug}.${row.size.amount}`}
                        row={row}
                        qty={qtyOf(row)}
                        locale={locale}
                        showFat={!sharedFat}
                        showSize={!sharedSize}
                        showBox={!sharedBox}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

/** Enter and the arrow keys move between quantity fields, like a spreadsheet. */
function moveFocus(from: HTMLInputElement, by: number) {
  const fields = [...document.querySelectorAll<HTMLInputElement>("[data-sheet-input]")];
  const next = fields[fields.indexOf(from) + by];
  if (next) next.focus();
  else from.blur();
}

function SheetRow({
  row,
  qty,
  locale,
  showFat,
  showSize,
  showBox,
}: {
  row: Row;
  qty: number;
  locale: Locale;
  showFat: boolean;
  showSize: boolean;
  showBox: boolean;
}) {
  const dict = getDictionary(locale);
  const { product, size } = row;
  const label = product.flavour?.[locale] ?? product.short?.[locale] ?? product.name[locale];
  const fat = formatFat(product.fatPercent, locale);
  const sizeText = formatSize(size, dict);
  const fullName = `${product.name[locale]}, ${sizeText}`;
  const detail = [
    showSize && sizeText,
    showFat && !label.includes(fat) && fat,
    showBox && fill(dict.list.perBox, { count: size.piecesPerBox }),
  ].filter(Boolean);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(event.currentTarget, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(event.currentTarget, -1);
    }
  };

  return (
    <li data-sheet-row={`${product.slug}.${size.amount}`} className={`flex items-center gap-2 py-1 pr-1.5 pl-2 transition-colors sm:pl-3 ${qty > 0 ? "bg-mist" : ""}`}>
      <Link href={`/${locale}/products/${product.slug}/`} className="flex min-w-0 flex-1 items-center gap-2.5">
        {/* The whole pack has to show: the fruit near the bottom is how flavours are told apart. */}
        <span data-sheet-thumb className="tint-tile block size-11 shrink-0 overflow-hidden rounded-lg p-0.5" style={tintStyle(product.tint) as CSSProperties}>
          <img src={webpPath(size.image, "shelf")} alt="" width={44} height={44} loading="lazy" decoding="async" className="size-full object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block leading-tight font-extrabold text-navy">{label}</span>
          {qty > 0 ? (
            <span className="block text-xs leading-snug font-extrabold text-brand" data-row-pieces>
              {qty} × {size.piecesPerBox} = {plural(locale, qty * size.piecesPerBox, dict.list.pieces)}
            </span>
          ) : (
            detail.length > 0 && <span className="block text-xs leading-snug font-bold text-slate">{detail.join(" · ")}</span>
          )}
        </span>
      </Link>
      <div className={`flex h-11 shrink-0 items-center rounded-full border-2 bg-white transition-colors ${qty > 0 ? "border-brand" : "border-line"}`}>
        <button
          type="button"
          disabled={qty === 0}
          tabIndex={-1}
          onClick={() => setQty(product.slug, size.amount, qty - 1)}
          aria-label={`${dict.list.decrease}: ${fullName}`}
          className="grid h-full w-10 place-items-center rounded-full text-xl font-black text-brand transition hover:bg-mist disabled:text-line"
        >
          −
        </button>
        <input
          data-sheet-input
          type="text"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="0"
          value={qty > 0 ? String(qty) : ""}
          aria-label={`${dict.list.quantity}: ${fullName}`}
          onChange={(e) => setQty(product.slug, size.amount, Number(e.target.value.replace(/\D/g, "").slice(0, 3)))}
          onFocus={(e) => e.target.select()}
          onKeyDown={onKeyDown}
          className="sheet-input h-full w-9 bg-transparent text-center text-base font-black text-navy tabular-nums outline-none placeholder:text-slate/60"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setQty(product.slug, size.amount, qty + 1)}
          aria-label={`${dict.list.increase}: ${fullName}`}
          className="grid h-full w-10 place-items-center rounded-full text-xl font-black text-brand transition hover:bg-mist"
        >
          +
        </button>
      </div>
    </li>
  );
}
