"use client";

import Link from "@/components/Link";
import { AddToListCompact } from "./AddToList";
import { LineBadge } from "./LineBadge";
import type { Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSizes, webpPath } from "@/lib/format";
import { tintStyle } from "@/lib/tints";

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const dict = getDictionary(locale);
  const image = product.sizes[0].image;
  const name = product.name[locale];
  const perBox = fill(dict.list.perBox, { count: product.sizes.map((s) => s.piecesPerBox).join(" / ") });

  return (
    <div
      data-pack-scope
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-3 transition hover:border-sky-soft hover:shadow-card sm:p-4"
    >
      <Link href={`/${locale}/products/${product.slug}/`} className="flex flex-1 flex-col">
        <div className="tint-tile relative aspect-square rounded-xl" style={tintStyle(product.tint)}>
          <picture className="absolute inset-3 flex items-center justify-center">
            <source srcSet={webpPath(image, "thumb")} type="image/webp" />
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.04]"
            />
          </picture>
        </div>
        <div className="mt-3 flex flex-1 flex-col items-start gap-1.5">
          <LineBadge line={product.line} />
          <h2 className="text-sm leading-snug font-extrabold text-navy sm:text-base">{name}</h2>
          <p className="mt-auto pt-1 text-sm leading-snug font-bold text-slate">
            {formatFat(product.fatPercent, locale)} · {formatSizes(product, dict)}
            <span className="block font-semibold">{perBox}</span>
          </p>
        </div>
      </Link>
      <div className="mt-2.5 space-y-1.5">
        {product.sizes.map((size) => (
          <AddToListCompact key={size.amount} product={product} size={size} locale={locale} />
        ))}
      </div>
    </div>
  );
}
