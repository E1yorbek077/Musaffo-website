import type { CSSProperties } from "react";
import Link from "./Link";
import type { CategorySlug } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatSize, webpPath } from "@/lib/format";
import { fanOf, PACK_RATIO, PACK_W, packSrcSet, productsOf, rangeFacts } from "@/lib/range";

/** Assortment, fat and sizes as small white chips on the category's colour. */
export function FactChips({ category, locale }: { category: CategorySlug; locale: Locale }) {
  return (
    <dl className="mt-5 flex flex-wrap gap-2">
      {rangeFacts(category, locale).map((f) => (
        <div key={f.label} className="rounded-2xl bg-white/75 px-4 py-2 backdrop-blur-sm">
          <dt className="text-xs font-extrabold opacity-75">{f.label}</dt>
          <dd className="font-black">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A category's packs standing side by side, overlapping, the centre one in front: on the home page range and at the
 * top of each category page. `eager` for the top of a page, where the packs are the first thing seen.
 */
export function PackFan({ category, locale, eager = false }: { category: CategorySlug; locale: Locale; eager?: boolean }) {
  const dict = getDictionary(locale);
  const fan = fanOf(productsOf(category));
  return (
    <div className="range-fan" data-wide={PACK_RATIO[category] > 1 ? "" : undefined} style={{ "--pack-w": PACK_W[category], "--pack-ratio": PACK_RATIO[category] } as CSSProperties}>
      {fan.map((p, i) => {
        const d = i - (fan.length - 1) / 2;
        const centre = d === 0;
        return (
          <Link
            key={p.id}
            href={`/${locale}/products/${p.slug}/`}
            data-range-pack={p.slug}
            className="range-pack"
            style={{ "--d": d, "--ad": Math.abs(d), zIndex: 10 - Math.abs(Math.round(d * 2)) } as CSSProperties}
            aria-label={`${p.name[locale]}, ${formatSize(p.sizes[0], dict)}`}
          >
            <img
              src={webpPath(p.sizes[0].image, "thumb")}
              srcSet={packSrcSet(p.sizes[0].image, category)}
              sizes={PACK_W[category]}
              alt=""
              width={480}
              height={480}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager && centre ? "high" : undefined}
              decoding="async"
              draggable={false}
            />
          </Link>
        );
      })}
    </div>
  );
}
