"use client";

import { useState } from "react";
import Link from "./Link";
import { Receipt } from "./Receipt";
import { UsualOrder } from "./UsualOrder";
import { getDictionary, type Locale } from "@/i18n";
import { plural, webpPath } from "@/lib/format";
import { applyLines, useOrderHistory, useOrderList, type LastOrder } from "@/lib/order-list";
import { formatPlacedAt, receiptLines } from "@/lib/receipt";

/**
 * Every order placed from this device (the last 12, kept only in this browser), newest first. Each opens as its
 * receipt and can be put back on the list as it was.
 */
export function OrdersPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.orders;
  const history = useOrderHistory();
  const orders = [...history].reverse();
  const [open, setOpen] = useState<string | null>(null);
  // The newest receipt is open until the visitor picks another.
  const openKey = open ?? (orders[0] ? keyOf(orders[0]) : null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-black text-brand sm:text-4xl">{t.title}</h1>
      <p className="mt-2 font-semibold text-pretty text-slate">{t.intro}</p>

      {orders.length === 0 ? (
        <div data-orders-empty className="mt-6 rounded-3xl bg-linear-to-br from-mist to-sky-soft/60 px-6 py-14 text-center">
          <p className="text-xl font-black text-brand">{t.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md font-semibold text-pretty text-slate">{t.emptyHint}</p>
          <Link href={`/${locale}/catalog/`} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-7 font-extrabold text-white transition hover:bg-brand-bright">
            {dict.list.emptyCta}
          </Link>
        </div>
      ) : (
        <>
        {/* What this shop usually orders, learned from these orders: the quickest way to order again. */}
        <div className="mt-6">
          <UsualOrder locale={locale} />
        </div>
        <ol className="mt-6 space-y-3">
          {orders.map((order) => (
            <OrderCard key={keyOf(order)} order={order} locale={locale} open={keyOf(order) === openKey} onToggle={() => setOpen(keyOf(order) === openKey ? "" : keyOf(order))} />
          ))}
        </ol>
        </>
      )}
    </div>
  );
}

const keyOf = (order: LastOrder) => `${order.orderNumber}|${order.placedAt}`;

function OrderCard({ order, locale, open, onToggle }: { order: LastOrder; locale: Locale; open: boolean; onToggle: () => void }) {
  const dict = getDictionary(locale);
  const t = dict.orders;
  const list = useOrderList();
  const { lines, totals } = receiptLines(order);
  const onList = order.lines.every((o) => list.some((l) => l.slug === o.slug && l.amount === o.amount && l.qty === o.qty));
  const panel = `receipt-${order.orderNumber}-${order.placedAt.replace(/\W/g, "")}`;

  const repeat = onList ? (
    <Link href={`/${locale}/list/`} data-orders-go className="inline-flex min-h-12 items-center rounded-full bg-leaf-dark px-5 font-extrabold text-white transition hover:bg-leaf">
      ✓ {dict.usual.done} · {dict.usual.order} →
    </Link>
  ) : (
    <button type="button" data-orders-repeat onClick={() => applyLines(order.lines)} className="inline-flex min-h-12 items-center rounded-full bg-brand px-5 font-extrabold text-white shadow-md transition hover:bg-navy">
      ↻ {t.repeat}
    </button>
  );

  return (
    <li data-orders-item={order.orderNumber} className="rounded-3xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <button type="button" aria-expanded={open} aria-controls={panel} onClick={onToggle} className="flex min-w-0 flex-1 basis-full items-center gap-3 text-left sm:basis-auto">
          <span className="flex h-12 shrink-0 items-end -space-x-3" aria-hidden="true">
            {lines.slice(0, 4).map((r) => (
              <img key={`${r.slug}.${r.amount}`} src={webpPath(r.size.image, "shelf")} alt="" width={36} height={48} loading="lazy" decoding="async" className="h-full w-9 object-contain drop-shadow" />
            ))}
          </span>
          <span className="min-w-0">
            <span className="block font-black whitespace-nowrap text-navy tabular-nums">{order.orderNumber}</span>
            <span className="block text-sm font-bold text-slate tabular-nums">{formatPlacedAt(order.placedAt)}</span>
            <span className="block text-sm font-bold text-slate">
              {plural(locale, totals.products, dict.list.products)}, {plural(locale, totals.boxes, dict.list.boxes)}
            </span>
          </span>
          <svg viewBox="0 0 24 24" className={`ml-auto size-5 shrink-0 text-brand transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span className="sr-only">{open ? t.hide : t.show}</span>
        </button>
        {!open && repeat}
      </div>
      {open && (
        <div id={panel} className="border-t border-line bg-mist/50 px-3 pt-6 pb-4 sm:px-6">
          <Receipt order={order} locale={locale} actions={repeat} />
        </div>
      )}
    </li>
  );
}
