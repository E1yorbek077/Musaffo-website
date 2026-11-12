import type { CSSProperties } from "react";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { FactChips, PackFan } from "./PackFan";
import { categories, products, type BrandLine } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill } from "@/lib/format";
import { chipLabel, LEAD, productsOf } from "@/lib/range";
import { tintStyle } from "@/lib/tints";

/**
 * The home page's product showcase: each category on its own colour panel, with a fan of large packs, what's in
 * it (flavours by line), the figures from the price list and a way into the category. Every figure comes from
 * data/products.ts (see lib/range.ts).
 */
export function RangeShowcase({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.range;

  return (
    <section data-range aria-labelledby="range-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 md:pt-16">
        <p className="text-sm font-extrabold tracking-wide text-brand uppercase">{fill(t.count, { categories: categories.length, products: products.length })}</p>
        <h2 id="range-title" className="mt-1 text-3xl font-black text-navy sm:text-4xl lg:text-5xl">
          {t.title}
        </h2>
      </div>

      {categories.map((category, n) => {
        const list = productsOf(category.slug);
        const lines = [...new Set(list.map((p) => p.line))] as BrandLine[];
        const flipped = n % 2 === 1;
        return (
          <article
            key={category.slug}
            data-range-panel={category.slug}
            aria-labelledby={`range-${category.slug}`}
            className="range-panel relative overflow-hidden"
            style={tintStyle(LEAD[category.slug]) as CSSProperties}
          >
            <div className={`mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 md:gap-10 md:py-14 lg:py-16 ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}>
              <PackFan category={category.slug} locale={locale} />

              <div className="relative text-(--stage-ink)">
                <p className="font-black tabular-nums opacity-70">
                  {String(n + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}
                </p>
                <h3 id={`range-${category.slug}`} className="mt-1 text-3xl leading-tight font-black text-balance sm:text-4xl lg:text-5xl">
                  {dict.categories[category.slug]}
                </h3>
                <p className="mt-2 max-w-xl text-lg font-bold text-pretty">{t.lead[category.slug]}</p>

                <FactChips category={category.slug} locale={locale} />

                <div className="mt-5 space-y-2" data-range-flavours>
                  {lines.map((line) => (
                    <p key={line} className="flex flex-wrap items-center gap-1.5">
                      <LineBadge line={line} />
                      {list
                        .filter((p) => p.line === line)
                        .map((p) => (
                          <Link
                            key={p.id}
                            href={`/${locale}/products/${p.slug}/`}
                            className="inline-flex min-h-9 items-center rounded-full border-2 border-white/80 bg-white/40 px-3 text-sm font-extrabold transition hover:border-(--stage-ink) hover:bg-white"
                          >
                            {chipLabel(p, list, locale)}
                          </Link>
                        ))}
                    </p>
                  ))}
                </div>

                <Link
                  href={`/${locale}/catalog/${category.slug}/`}
                  data-range-cta
                  className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-(--stage-ink) px-6 font-extrabold text-white shadow-md transition hover:gap-3"
                >
                  {t.see}
                  <span className="sr-only">: {dict.categories[category.slug]}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
