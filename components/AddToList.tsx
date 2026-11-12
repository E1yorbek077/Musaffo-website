"use client";

import { useState, type MouseEvent } from "react";
import type { Product, ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { flyToList } from "@/lib/fly-to-list";
import { formatSize, plural } from "@/lib/format";
import { setQty, useOrderList } from "@/lib/order-list";

type Props = { product: Product; size: ProductSize; locale: Locale };

const STEP_BUTTON = "grid shrink-0 place-items-center rounded-full font-black text-brand transition hover:bg-mist";

/** Box stepper with a typed field, because shops order 20 boxes as readily as 2. */
export function Stepper({
  qty,
  locale,
  label,
  onChange,
}: {
  qty: number;
  locale: Locale;
  label: string;
  onChange: (qty: number) => void;
}) {
  const dict = getDictionary(locale);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft !== null && draft !== "") onChange(Number(draft));
    setDraft(null);
  };

  return (
    <div className="inline-flex h-12 items-center rounded-full border-2 border-brand bg-white">
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`${dict.list.decrease}: ${label}`} className={`${STEP_BUTTON} size-11 text-xl`}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? String(qty)}
        aria-label={`${dict.list.quantity}: ${label}`}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-full w-10 bg-transparent text-center text-lg font-black text-navy tabular-nums outline-none"
      />
      <button type="button" onClick={() => onChange(qty + 1)} aria-label={`${dict.list.increase}: ${label}`} className={`${STEP_BUTTON} size-11 text-xl`}>
        +
      </button>
    </div>
  );
}

function useLine({ product, size }: Props) {
  const lines = useOrderList();
  const qty = lines.find((l) => l.slug === product.slug && l.amount === size.amount)?.qty ?? 0;
  const set = (next: number) => setQty(product.slug, size.amount, next);
  const add = (event: MouseEvent<HTMLButtonElement>) => {
    flyToList(event.currentTarget);
    set(qty + 1);
  };
  return { qty, set, add };
}

/** Main call to action, on the product page and in the fridge quick view. */
export function AddToList({ showPieces = false, ...props }: Props & { showPieces?: boolean }) {
  const { product, size, locale } = props;
  const dict = getDictionary(locale);
  const { qty, set, add } = useLine(props);
  const label = `${product.name[locale]}, ${formatSize(size, dict)}`;

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={add}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-extrabold text-white shadow-md transition hover:bg-brand-bright active:scale-[0.98]"
      >
        + {dict.list.add}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <Stepper qty={qty} locale={locale} label={label} onChange={set} />
      {showPieces && (
        <p className="font-extrabold text-navy" aria-live="polite">
          {plural(locale, qty, dict.list.boxes)} = {plural(locale, qty * size.piecesPerBox, dict.list.pieces)}
        </p>
      )}
    </div>
  );
}

/** Small version for catalog cards, narrow enough for a two-column phone grid. */
export function AddToListCompact(props: Props) {
  const { product, size, locale } = props;
  const dict = getDictionary(locale);
  const { qty, set, add } = useLine(props);
  const sizeText = formatSize(size, dict);
  const label = `${product.name[locale]}, ${sizeText}`;
  const hasChoice = product.sizes.length > 1;

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={add}
        aria-label={`${dict.list.add}: ${label}`}
        className="flex min-h-11 w-full items-center justify-center rounded-full border-2 border-brand px-2 text-sm font-extrabold text-brand transition hover:bg-brand hover:text-white active:scale-[0.98]"
      >
        + {hasChoice ? sizeText : dict.list.addShort}
      </button>
    );
  }

  return (
    <div className="flex min-h-11 items-center justify-between rounded-full bg-brand text-white">
      <button type="button" onClick={() => set(qty - 1)} aria-label={`${dict.list.decrease}: ${label}`} className="grid size-11 shrink-0 place-items-center rounded-full text-xl font-black hover:bg-white/15">
        −
      </button>
      <span className="min-w-0 text-center leading-none" aria-live="polite">
        <span className="block font-black tabular-nums">{qty}</span>
        <span className="block text-xs font-bold whitespace-nowrap text-white/90">{hasChoice ? sizeText : dict.list.boxUnit}</span>
      </span>
      <button type="button" onClick={() => set(qty + 1)} aria-label={`${dict.list.increase}: ${label}`} className="grid size-11 shrink-0 place-items-center rounded-full text-xl font-black hover:bg-white/15">
        +
      </button>
    </div>
  );
}
