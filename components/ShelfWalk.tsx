"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { AddToListCompact } from "./AddToList";
import Link from "./Link";
import { lineLabels } from "./LineBadge";
import { categories, type Product, type ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { productsInCategory } from "@/lib/catalog";
import { flyToList } from "@/lib/fly-to-list";
import { fill, formatFat, formatSize, webpPath } from "@/lib/format";
import { addQty, mergeIntoList, useOrderList } from "@/lib/order-list";

type Slot = { product: Product; size: ProductSize; key: string };

/** Each shelf's first product page: where "next shelf" leads, so a visitor can walk the whole range. */
const firstOf = (slug: (typeof categories)[number]["slug"]) => productsInCategory(slug)[0];

/**
 * Under every product, the rest of its category stands on a fridge shelf. Each pack can be added where it stands,
 * a bar shows how much of the shelf is on the list, one tap adds a box of everything still missing, and the
 * neighbouring shelves are one tap away. Shops stock a line, not a single pack, so the page shouldn't end at one.
 */
export function ShelfWalk({ product, size, locale }: { product: Product; size: ProductSize; locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.shelf;
  const list = useOrderList();
  const [added, setAdded] = useState<Slot[] | null>(null);

  const slots: Slot[] = productsInCategory(product.category).flatMap((p) =>
    p.sizes.map((s) => ({ product: p, size: s, key: `${p.slug}.${s.amount}` })),
  );
  const qtyOf = (slot: Slot) => list.find((l) => l.slug === slot.product.slug && l.amount === slot.size.amount)?.qty ?? 0;
  const missing = slots.filter((s) => qtyOf(s) === 0);
  const onList = slots.length - missing.length;
  const complete = missing.length === 0;
  // Rows of equal length at each width (9 packs: 5 + 4, not 8 + 1), so no pack stands alone on a near-empty shelf.
  const balanced = (max: number) => Math.ceil(slots.length / Math.ceil(slots.length / max));
  const columns = { "--cols-md": balanced(4), "--cols-lg": balanced(6), "--cols-xl": balanced(8) } as CSSProperties;

  const at = categories.findIndex((c) => c.slug === product.category);
  const neighbours = [
    { dir: "prev" as const, category: categories[(at - 1 + categories.length) % categories.length] },
    { dir: "next" as const, category: categories[(at + 1) % categories.length] },
  ];

  const addMissing = (event: MouseEvent<HTMLButtonElement>) => {
    flyToList(event.currentTarget);
    mergeIntoList(missing.map((s) => ({ slug: s.product.slug, amount: s.size.amount, qty: 1 })));
    setAdded(missing);
  };
  // Takes back only the box this button added, so anything changed by hand since then stays.
  const undo = () => {
    added?.forEach((s) => addQty(s.product.slug, s.size.amount, -1));
    setAdded(null);
  };

  return (
    <section data-shelf aria-labelledby="shelf-title" className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-sm font-extrabold text-brand">{t.eyebrow}</p>
          <h2 id="shelf-title" className="text-2xl leading-tight font-black text-navy md:text-3xl">
            {dict.categories[product.category]}
          </h2>
        </div>
        <div className="w-full max-w-xs" data-shelf-progress={`${onList}/${slots.length}`}>
          <p className="mb-1.5 text-sm font-extrabold text-navy" aria-live="polite">
            {complete ? t.complete : fill(t.progress, { count: onList, total: slots.length })}
          </p>
          <div className="h-2.5 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-leaf-dark transition-[width] duration-500" style={{ width: `${(onList / slots.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="shelf-case mt-4">
        <ul className="shelf-row" style={columns} tabIndex={0} aria-label={dict.categories[product.category]}>
          {slots.map((slot) => {
            const qty = qtyOf(slot);
            const here = slot.product.slug === product.slug && slot.size.amount === size.amount;
            const title = `${slot.product.name[locale]}, ${formatSize(slot.size, dict)}`;
            return (
              <li
                key={slot.key}
                data-shelf-item={slot.key}
                data-on-list={qty > 0 ? "" : undefined}
                data-pack-scope
                aria-current={here ? "true" : undefined}
                className="shelf-tile"
              >
                <Link href={`/${locale}/products/${slot.product.slug}/`} className="shelf-slot" aria-label={title}>
                  {here && <span className="shelf-here">{t.here}</span>}
                  {qty > 0 && (
                    <span className="shelf-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  <img
                    key={qty > 0 ? "on" : "off"}
                    src={webpPath(slot.size.image, "shelf")}
                    alt=""
                    width={120}
                    height={120}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className={qty > 0 ? "shelf-pop" : undefined}
                  />
                </Link>
                <div className="shelf-lip" aria-hidden="true" />
                <div className="shelf-tag">
                  <p className="line-clamp-2 min-h-[2.5em] text-sm leading-tight font-extrabold text-navy">{slot.product.name[locale]}</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate">
                    {lineLabels[slot.product.line]} · {formatFat(slot.product.fatPercent, locale)} · {formatSize(slot.size, dict)}
                  </p>
                  <div className="mt-2">
                    <AddToListCompact product={slot.product} size={slot.size} locale={locale} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
        {added ? (
          <>
            <span data-shelf-added className="font-extrabold text-leaf-dark">
              ✓ {fill(t.added, { count: added.length })}
            </span>
            <button type="button" data-shelf-undo onClick={undo} className="min-h-11 font-extrabold text-brand underline underline-offset-2">
              {t.undo}
            </button>
          </>
        ) : (
          !complete && (
            <button
              type="button"
              data-shelf-fill
              onClick={addMissing}
              className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-5 font-extrabold text-brand transition hover:bg-brand hover:text-white"
            >
              + {fill(onList === 0 ? t.addAll : t.addMissing, { count: missing.length })}
            </button>
          )
        )}
        <span className="text-sm font-bold text-slate">{t.hint}</span>
      </div>

      <nav aria-label={t.walk} className="mt-6 grid gap-3 sm:grid-cols-2">
        {neighbours.map(({ dir, category }) => {
          const first = firstOf(category.slug);
          return (
            <Link
              key={dir}
              href={`/${locale}/products/${first.slug}/`}
              data-shelf-walk={dir}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-brand hover:shadow-md"
            >
              <span className="flex h-14 shrink-0 items-end -space-x-3" aria-hidden="true">
                {category.images.slice(0, 3).map((image) => (
                  <img key={image} src={webpPath(image, "shelf")} alt="" width={40} height={56} loading="lazy" decoding="async" className="h-full w-10 object-contain drop-shadow" />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-slate">{dir === "next" ? t.next : t.prev}</span>
                <span className="block truncate font-black text-navy group-hover:text-brand">{dict.categories[category.slug]}</span>
              </span>
              <span className={`text-xl font-black text-brand transition ${dir === "next" ? "group-hover:translate-x-0.5" : "order-first group-hover:-translate-x-0.5"}`} aria-hidden="true">
                {dir === "next" ? "→" : "←"}
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
