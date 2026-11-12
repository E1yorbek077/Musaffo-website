"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Link from "./Link";
import { ProductQuickView } from "./ProductQuickView";
import { categories, type CategorySlug, type Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { getProduct, productsInCategory } from "@/lib/catalog";
import { formatFat, plural, webpPath } from "@/lib/format";
import { useOrderList } from "@/lib/order-list";

/**
 * Where each category sits in the fridge. Products are read from data/products.ts,
 * so a new product appears on its shelf automatically.
 *  shelf:   row on large screens (phones get one swipeable shelf per category)
 *  unit:    relative width of one product on large screens
 *  stacked: two rows of packs on one shelf, for wide cups
 *  phone:   product width on phones
 */
const LAYOUT: Record<CategorySlug, { shelf: number; unit: number; stacked?: boolean; phone: string }> = {
  milk: { shelf: 0, unit: 1.05, phone: "w-24" },
  "kefir-ayron": { shelf: 0, unit: 0.9, phone: "w-20" },
  "butter-qatiq": { shelf: 0, unit: 1.7, phone: "w-36" },
  "drinking-yogurt": { shelf: 1, unit: 1, phone: "w-18" },
  "thick-yogurt": { shelf: 2, unit: 0.7, stacked: true, phone: "w-40" },
  "glazed-sirok": { shelf: 2, unit: 0.62, phone: "w-18" },
};

const shelves = [0, 1, 2].map((shelf) => categories.filter((c) => LAYOUT[c.slug].shelf === shelf));

export function Fridge({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [slug, setSlug] = useState<string | null>(null);
  const pushedEntry = useRef(false);

  // The open product lives in the URL hash: the phone back button closes the
  // sheet instead of leaving the page, and a product view can be shared as a link.
  useEffect(() => {
    const sync = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) pushedEntry.current = false;
      setSlug(getProduct(hash) ? hash : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const open = (event: MouseEvent, target: string) => {
    // Let Ctrl/Cmd/middle click open the full product page in a new tab.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    window.history.pushState(null, "", `#${target}`);
    pushedEntry.current = true;
    setSlug(target);
  };

  const close = () => {
    if (!window.location.hash) {
      setSlug(null);
    } else if (pushedEntry.current) {
      pushedEntry.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setSlug(null);
    }
  };

  const selectVariant = (target: string) => {
    window.history.replaceState(null, "", `#${target}`);
    setSlug(target);
  };

  const total = categories.reduce((sum, c) => sum + productsInCategory(c.slug).length, 0);
  let order = 0;

  return (
    <>
      <section aria-label={dict.home.fridgeLabel} className="fridge-cabinet">
        <div className="fridge-top">
          <span className="fridge-led" aria-hidden="true">
            +4°C
          </span>
          <img src="/brand/logo.svg" alt="" width={138} height={43} className="h-8 w-auto sm:h-10" />
          <span className="text-right text-xs font-extrabold text-white/90 sm:text-sm">
            {plural(locale, total, dict.catalog.resultCount)}
          </span>
        </div>

        <div className="fridge-interior">
          <div className="fridge-lightbar" aria-hidden="true" />
          {shelves.map((row, rowIndex) => (
            <div key={rowIndex} className="lg:flex">
              {row.map((category) => {
                const layout = LAYOUT[category.slug];
                const items = productsInCategory(category.slug);
                const columns = layout.stacked ? Math.ceil(items.length / 2) : items.length;
                return (
                  <div key={category.slug} className="fridge-group min-w-0" style={{ "--grow": columns * layout.unit * (layout.stacked ? 2 : 1) } as CSSProperties}>
                    <ul
                      className={`fridge-items ${layout.stacked ? "fridge-items-stacked" : ""}`}
                      style={{ "--cols": columns } as CSSProperties}
                    >
                      {items.map((product) => (
                        <li key={product.id} className={`${layout.phone} shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1`}>
                          <ShelfItem
                            product={product}
                            locale={locale}
                            index={order++}
                            eager={rowIndex === 0}
                            // The largest packs near the top are what the browser reports as LCP.
                            priority={category.slug === "butter-qatiq"}
                            onOpen={open}
                          />
                        </li>
                      ))}
                    </ul>
                    <Link href={`/${locale}/catalog/${category.slug}/`} className="fridge-rail">
                      <span className="truncate">{dict.categories[category.slug]}</span>
                      <span aria-hidden="true" className="fridge-rail-arrow">
                        →
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Opening animation. Purely visual: it never blocks clicks and is off for reduced motion. */}
          <div className="fridge-dim" aria-hidden="true" />
          <div className="fridge-mist" aria-hidden="true" />
          <div className="fridge-door" aria-hidden="true">
            <span className="fridge-door-handle" />
            <img src="/brand/logo.svg" alt="" width={138} height={43} className="fridge-door-logo" />
          </div>
        </div>

        <div className="fridge-grille" aria-hidden="true" />
      </section>

      <ProductQuickView product={slug ? (getProduct(slug) ?? null) : null} locale={locale} onClose={close} onSelectVariant={selectVariant} />
    </>
  );
}

function ShelfItem({
  product,
  locale,
  index,
  eager,
  priority,
  onOpen,
}: {
  product: Product;
  locale: Locale;
  index: number;
  eager: boolean;
  priority: boolean;
  onOpen: (event: MouseEvent, slug: string) => void;
}) {
  const image = product.sizes[0].image;
  const label = product.flavour?.[locale] ?? product.name[locale];
  const fat = formatFat(product.fatPercent, locale);
  const boxes = useOrderList()
    .filter((line) => line.slug === product.slug)
    .reduce((sum, line) => sum + line.qty, 0);

  return (
    <a
      href={`/${locale}/products/${product.slug}/`}
      onClick={(e) => onOpen(e, product.slug)}
      aria-label={`${product.name[locale]}, ${fat}${boxes > 0 ? `, ${plural(locale, boxes, getDictionary(locale).list.boxes)}` : ""}`}
      className="fridge-item"
      style={{ "--i": index } as CSSProperties}
    >
      <picture className="flex h-full w-full items-end justify-center">
        <source srcSet={webpPath(image, "shelf")} type="image/webp" />
        <img
          src={image}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="fridge-pack"
        />
      </picture>
      {boxes > 0 && (
        <span className="fridge-count" aria-hidden="true">
          {boxes}
        </span>
      )}
      <span className="fridge-tag" aria-hidden="true">
        {label} · {fat}
      </span>
    </a>
  );
}
