"use client";

import { usePathname } from "next/navigation";
import Link from "./Link";
import { getDictionary, type Locale } from "@/i18n";
import { plural, webpPath } from "@/lib/format";
import { listTotals, resolveLine, resolveLines, useOrderList } from "@/lib/order-list";

/** Follows the visitor on every page once the list has something in it. */
export function OrderBar({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const lines = useOrderList();

  if (lines.length === 0 || /\/list\/?$/.test(pathname)) return null;

  const totals = listTotals(resolveLines(lines));
  const recent = lines.slice(-3).map(resolveLine).reverse();

  return (
    <>
      {/* Keeps the end of the page from sitting underneath the bar. */}
      <div aria-hidden="true" className="h-20 bg-brand print:hidden" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden">
        <Link
          data-order-bar
          href={`/${locale}/list/`}
          className="order-bar pointer-events-auto flex min-h-14 w-full max-w-lg items-center gap-3 rounded-full bg-navy py-1.5 pr-1.5 pl-3 text-white shadow-[0_12px_32px_rgb(10_47_87_/_0.45)]"
        >
          {/* Narrow phones need the room for the totals: no packs under 360px, one under 430px. */}
          <span className="hidden shrink-0 min-[360px]:flex" aria-hidden="true">
            {recent.map(
              (r, i) =>
                r && (
                  <span key={`${r.slug}.${r.amount}`} className={`size-10 overflow-hidden rounded-full bg-white p-1 ring-2 ring-navy ${i === 0 ? "block" : "-ml-3 hidden min-[430px]:block"}`}>
                    <img src={webpPath(r.size.image, "shelf")} alt="" className="size-full object-contain" />
                  </span>
                ),
            )}
          </span>
          <span className="min-w-0 flex-1 leading-tight" aria-live="polite">
            <span key={totals.boxes} className="list-bump block font-black whitespace-nowrap">
              {plural(locale, totals.boxes, dict.list.boxes)}
            </span>
            <span className="block truncate text-xs font-bold text-white/85">
              {plural(locale, totals.products, dict.list.products)} · {plural(locale, totals.pieces, dict.list.pieces)}
            </span>
          </span>
          <span className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-4 font-extrabold text-brand">
            {dict.nav.list} <span aria-hidden="true">&nbsp;→</span>
          </span>
        </Link>
      </div>
    </>
  );
}
