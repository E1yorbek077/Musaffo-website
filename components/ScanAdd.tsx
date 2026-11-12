"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { Stepper } from "./AddToList";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSize, plural, webpPath } from "@/lib/format";
import { parseKey } from "@/lib/labels";
import {
  addQty,
  listTotals,
  resolveLines,
  setQty,
  useOrderList,
} from "@/lib/order-list";
import { tintStyle } from "@/lib/tints";

type State = "reading" | "added" | "again" | "undone" | "unknown";

/** Marks the history entry, so reloading the page or coming back to it doesn't count the same scan twice. */
const COUNTED = "musaffoScanCounted";

/**
 * Opened by the QR code on a printed shelf label (lib/qr.ts): one box of that product goes on the order list at once,
 * with undo and a stepper. The shop walks along its fridge scanning what runs low, then opens the list and orders.
 */
export function ScanAdd({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.scan;
  const lines = useOrderList();
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<State>("reading");
  const found = code ? parseKey(code) : null;

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("p") ?? "";
    const target = parseKey(key);
    /* eslint-disable react-hooks/set-state-in-effect -- the product is in the URL, readable only after hydration */
    setCode(key);
    if (!target) {
      setState("unknown");
      return;
    }
    if (window.history.state?.[COUNTED]) {
      setState("again");
      return;
    }
    addQty(target.product.slug, target.size.amount, 1);
    window.history.replaceState(
      { ...window.history.state, [COUNTED]: true },
      "",
    );
    setState("added");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (state === "reading")
    return <div className="min-h-[60vh]" aria-busy="true" />;

  if (!found) {
    return (
      <div
        data-scan
        data-scan-state="unknown"
        className="mx-auto max-w-xl px-4 py-14 text-center"
      >
        <h1 className="text-2xl font-black text-brand">{t.title}</h1>
        <p className="mt-3 font-semibold text-slate">{t.unknown}</p>
        <Link
          href={`/${locale}/catalog/`}
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-7 font-extrabold text-white"
        >
          {dict.list.emptyCta}
        </Link>
      </div>
    );
  }

  const { product, size } = found;
  const qty =
    lines.find((l) => l.slug === product.slug && l.amount === size.amount)
      ?.qty ?? 0;
  const totals = listTotals(resolveLines(lines));
  const title = `${product.name[locale]}, ${formatSize(size, dict)}`;

  return (
    <div
      data-scan
      data-scan-state={state}
      className="mx-auto max-w-xl px-4 pt-5 pb-10"
    >
      <div
        className="tint-tile flex items-center gap-4 rounded-3xl p-4"
        style={tintStyle(product.tint) as CSSProperties}
      >
        <span className="block h-36 w-28 shrink-0">
          <picture className="flex h-full w-full items-center justify-center">
            <source srcSet={webpPath(size.image, "thumb")} type="image/webp" />
            <img
              src={size.image}
              alt=""
              className="max-h-full max-w-full object-contain drop-shadow-lg"
            />
          </picture>
        </span>
        <div className="min-w-0">
          <LineBadge line={product.line} />
          <h1 className="mt-1 text-xl leading-tight font-black text-navy">
            {product.name[locale]}
          </h1>
          <p className="mt-1 font-bold text-slate">
            {formatSize(size, dict)} · {formatFat(product.fatPercent, locale)} ·{" "}
            {fill(dict.list.perBox, { count: size.piecesPerBox })}
          </p>
        </div>
      </div>

      <div
        role="status"
        className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 font-extrabold ${
          state === "added"
            ? "bg-leaf-soft text-leaf-dark"
            : "bg-mist text-navy"
        }`}
      >
        <span>
          {state === "added"
            ? `✓ ${t.added}`
            : state === "again"
              ? t.again
              : t.undone}
        </span>
        {state === "added" && (
          <button
            type="button"
            data-scan-undo
            onClick={() => {
              addQty(product.slug, size.amount, -1);
              setState("undone");
            }}
            className="min-h-10 rounded-full bg-white px-4 text-sm font-extrabold text-leaf-dark underline-offset-2 hover:underline"
          >
            {t.undo}
          </button>
        )}
      </div>

      {qty > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-extrabold text-navy" data-scan-qty>
            {fill(t.inList, { boxes: plural(locale, qty, dict.list.boxes) })}
            <span className="block text-sm font-bold text-slate">
              {plural(locale, qty * size.piecesPerBox, dict.list.pieces)}
            </span>
          </p>
          <Stepper
            qty={qty}
            locale={locale}
            label={title}
            onChange={(n) =>
              setQty(product.slug, size.amount, Math.min(Math.max(n, 0), 999))
            }
          />
        </div>
      )}

      <p className="mt-6 flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-sky/50 px-4 py-3 font-bold text-pretty text-navy">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-7 shrink-0 text-brand"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
          <path d="M8 12h8" />
        </svg>
        {t.next}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {lines.length > 0 && (
          <Link
            href={`/${locale}/list/`}
            data-scan-list
            className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-extrabold text-white transition hover:bg-navy"
          >
            {t.openList} · {plural(locale, totals.products, dict.list.products)}
            , {plural(locale, totals.boxes, dict.list.boxes)}
          </Link>
        )}
        <Link
          href={`/${locale}/products/${product.slug}/`}
          className="inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 font-extrabold text-brand transition hover:bg-mist"
        >
          {t.product}
        </Link>
      </div>
    </div>
  );
}
