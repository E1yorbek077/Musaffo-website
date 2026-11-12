"use client";

import { useEffect, useRef, useState } from "react";
import { AddToList } from "./AddToList";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { chipClass, ProductSpecs } from "./ProductSpecs";
import { categories, type Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { variantsOf } from "@/lib/catalog";
import { formatSize, webpPath } from "@/lib/format";
import { tintStyle } from "@/lib/tints";

type Props = {
  product: Product | null;
  locale: Locale;
  onClose: () => void;
  onSelectVariant: (slug: string) => void;
};

/** Bottom sheet on phones, centred panel on larger screens. Uses native <dialog> for focus handling and Esc. */
export function ProductQuickView({ product, locale, onClose, onSelectVariant }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Keep the last product so the content doesn't vanish while the dialog closes.
  const [shown, setShown] = useState<Product | null>(product);
  if (product && product !== shown) setShown(product);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (product && !dialog.open) dialog.showModal();
    if (!product && dialog.open) dialog.close();
  }, [product]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="quick-view mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white text-navy md:m-auto md:max-w-4xl md:rounded-3xl"
    >
      {shown && (
        <QuickViewContent
          key={shown.id}
          product={shown}
          locale={locale}
          onDismiss={() => dialogRef.current?.close()}
          onSelectVariant={onSelectVariant}
        />
      )}
    </dialog>
  );
}

function QuickViewContent({
  product,
  locale,
  onDismiss,
  onSelectVariant,
}: {
  product: Product;
  locale: Locale;
  onDismiss: () => void;
  onSelectVariant: (slug: string) => void;
}) {
  const dict = getDictionary(locale);
  const [sizeIndex, setSizeIndex] = useState(0);
  const size = product.sizes[sizeIndex];
  const name = product.name[locale];
  const variants = variantsOf(product);
  const variantKind = categories.find((c) => c.slug === product.category)?.variantKind;

  return (
    <div data-pack-scope className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="tint-tile flex h-44 items-center justify-center p-4 md:h-auto md:min-h-112 md:p-8" style={tintStyle(product.tint)}>
        <picture key={size.image} className="flex h-full max-h-96 w-full items-center justify-center">
          {/* The pack is small on phones and large in the desktop panel. */}
          <source media="(min-width: 48rem)" srcSet={webpPath(size.image, "stage")} type="image/webp" />
          <source srcSet={webpPath(size.image, "thumb")} type="image/webp" />
          <img
            src={size.image}
            alt={`${name}, ${formatSize(size, dict)}`}
            className="max-h-full max-w-full object-contain drop-shadow-[0_14px_18px_rgb(10_47_87_/_0.2)]"
          />
        </picture>
      </div>

      <div className="relative p-5 sm:p-7">
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dict.product.close}
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-brand hover:bg-mist"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <LineBadge line={product.line} />
        <h2 className="mt-2 pr-10 text-xl leading-tight font-black text-brand sm:text-2xl">{name}</h2>

        {variants.length > 1 && (
          <div className="mt-4">
            <h3 className="mb-1.5 text-sm font-extrabold text-slate">
              {variantKind === "type" ? dict.product.type : dict.product.flavour}
            </h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button key={v.id} type="button" aria-pressed={v.id === product.id} onClick={() => onSelectVariant(v.slug)} className={chipClass(v.id === product.id)}>
                  {v.flavour?.[locale] ?? v.name[locale]}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes.length > 1 && (
          <div className="mt-4">
            <h3 className="mb-1.5 text-sm font-extrabold text-slate">{dict.product.size}</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s, i) => (
                <button key={s.image} type="button" aria-pressed={i === sizeIndex} onClick={() => setSizeIndex(i)} className={chipClass(i === sizeIndex)}>
                  {formatSize(s, dict)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <ProductSpecs product={product} size={size} locale={locale} />
        </div>

        {/* Stays in view while the sheet scrolls, so the main action is never below the fold. */}
        <div data-sheet-actions className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex items-center gap-3 border-t border-line bg-white px-5 py-3 sm:-mx-7 sm:-mb-7 sm:px-7">
          <div className="min-w-0 flex-1">
            <AddToList product={product} size={size} locale={locale} />
          </div>
          <Link
            href={`/${locale}/products/${product.slug}/`}
            className="inline-flex min-h-12 shrink-0 items-center rounded-full px-3 font-extrabold text-brand underline-offset-2 transition hover:underline"
          >
            {dict.product.details}
          </Link>
        </div>
      </div>
    </div>
  );
}
