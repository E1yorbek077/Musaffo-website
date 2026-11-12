"use client";

import { getDictionary, type Locale } from "@/i18n";
import { fill, plural } from "@/lib/format";
import { applyLines, listTotals, resolveLines, useLastOrder, useOrderList } from "@/lib/order-list";

/**
 * Shops order much the same things each week, so the last order can go back on the list in one tap.
 * Renders nothing until this browser has placed an order. Tapping twice doesn't double anything.
 */
export function RepeatLastOrder({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const last = useLastOrder();
  const current = useOrderList();
  if (!last) return null;

  const totals = listTotals(resolveLines(last.lines));
  const placed = new Date(last.placedAt);
  const date = Number.isNaN(placed.getTime())
    ? ""
    : `${String(placed.getDate()).padStart(2, "0")}.${String(placed.getMonth() + 1).padStart(2, "0")}.${placed.getFullYear()}`;
  const done = last.lines.every((line) => current.some((l) => l.slug === line.slug && l.amount === line.amount && l.qty === line.qty));

  return (
    <div data-repeat-order className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border-2 border-leaf-soft bg-leaf-soft/60 p-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-leaf-dark">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9" />
            <path d="M20 4v5h-5" />
            <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15" />
            <path d="M4 20v-5h5" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="leading-snug font-extrabold text-navy">{dict.quick.repeatTitle}</p>
          <p className="text-sm font-semibold text-slate">
            {fill(dict.quick.repeatMeta, {
              date,
              products: plural(locale, totals.products, dict.list.products),
              boxes: plural(locale, totals.boxes, dict.list.boxes),
            })}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={done}
        onClick={() => applyLines(last.lines)}
        className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-5 font-extrabold transition ${
          done ? "bg-white text-leaf-dark" : "bg-leaf-dark text-white hover:bg-leaf"
        }`}
      >
        {done ? `✓ ${dict.quick.repeatDone}` : dict.quick.repeatAction}
      </button>
    </div>
  );
}
