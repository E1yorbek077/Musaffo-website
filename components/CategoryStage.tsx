import type { CSSProperties } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { CurrentInView } from "./CurrentInView";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { FactChips, PackFan } from "./PackFan";
import { categories, type BrandLine, type CategorySlug } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { plural, webpPath } from "@/lib/format";
import { LEAD, productsOf } from "@/lib/range";
import { TINTS, tintStyle } from "@/lib/tints";

/**
 * The top of a category page: the category in its own colour, as on the home page range, with its packs large, what
 * it is and its figures. Above it, the six categories as aisles, each in its own colour with one of its packs, so
 * walking from one to the next is one tap.
 */
export function CategoryStage({ category, locale }: { category: CategorySlug; locale: Locale }) {
  const dict = getDictionary(locale);
  const list = productsOf(category);
  const lines = [...new Set(list.map((p) => p.line))] as BrandLine[];

  return (
    <section data-category-stage={category} className="category-stage relative overflow-hidden" style={tintStyle(LEAD[category]) as CSSProperties}>
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-14 sm:px-6 sm:pb-20 md:pt-6">
        <Breadcrumbs
          label={dict.nav.breadcrumb}
          className="text-(--stage-ink)"
          items={[
            { label: dict.nav.home, href: `/${locale}/` },
            { label: dict.nav.catalog, href: `/${locale}/catalog/` },
            { label: dict.categories[category] },
          ]}
        />

        <CurrentInView rowId="aisles" />
        <nav id="aisles" aria-label={dict.footer.categories} className="aisles relative -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
          {categories.map((c) => {
            const tint = TINTS[LEAD[c.slug]];
            const here = c.slug === category;
            return (
              <Link
                key={c.slug}
                href={`/${locale}/catalog/${c.slug}/`}
                data-aisle={c.slug}
                aria-current={here ? "page" : undefined}
                className="aisle"
                style={{ "--aisle-soft": tint.soft, "--aisle-mid": tint.mid, "--aisle-ink": tint.ink } as CSSProperties}
              >
                <img src={webpPath(c.images[0], "shelf")} alt="" width={28} height={36} decoding="async" className="h-8 w-7 object-contain" />
                <span>{dict.categories[c.slug]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 grid grid-cols-1 items-center gap-6 md:mt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10">
          <div className="text-(--stage-ink) md:order-1">
            <p className="flex flex-wrap gap-1.5">
              {lines.map((line) => (
                <LineBadge key={line} line={line} />
              ))}
            </p>
            <h1 className="mt-2 text-4xl leading-none font-black text-balance sm:text-5xl lg:text-6xl">{dict.categories[category]}</h1>
            <p className="mt-3 max-w-xl text-lg font-bold text-pretty sm:text-xl">{dict.range.lead[category]}</p>
            <FactChips category={category} locale={locale} />
            <a
              href="#products"
              data-stage-jump
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-(--stage-ink) px-6 font-extrabold text-white shadow-md transition hover:translate-y-0.5"
            >
              {plural(locale, list.length, dict.catalog.resultCount)} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="order-first md:order-2">
            <PackFan category={category} locale={locale} eager />
          </div>
        </div>
      </div>

      {/* Milk wave into the white product list, as on the product pages */}
      <svg aria-hidden="true" viewBox="0 0 1440 70" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-8 w-full text-white sm:h-14">
        <path fill="currentColor" d="M0 42c120-26 240-34 360-16s240 44 360 30 240-52 360-50 240 28 360 34v30H0z" />
      </svg>
    </section>
  );
}
