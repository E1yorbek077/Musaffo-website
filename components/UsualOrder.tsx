"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "./Link";
import { Stepper } from "./AddToList";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatSize, plural, webpPath } from "@/lib/format";
import { applyLines, customerLabel, resolveLine, useOrderHistory, useOrderList, type OrderLine } from "@/lib/order-list";
import { tintStyle } from "@/lib/tints";
import { daysSince, usualOrder } from "@/lib/usual";

const SHOWN = 6;
const noSubscribe = () => () => {};
const readCustomer = () => {
  try {
    return window.localStorage.getItem("musaffo-customer-v1") ?? "";
  } catch {
    return "";
  }
};

/**
 * For a shop that has ordered here before, its own order sheet at the top of "My orders": a greeting, the products
 * it usually orders at its usual quantities, and one tap to put them on the list. Renders nothing for a first visit.
 * Kept off the home page on purpose: that page is for showing the products.
 */
export function UsualOrder({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.usual;
  const history = useOrderHistory();
  const list = useOrderList();
  const customerRaw = useSyncExternalStore(noSubscribe, readCustomer, () => "");
  const usual = useMemo(() => usualOrder(history), [history]);
  const [changed, setChanged] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);

  // resolveLine one by one keeps usualOrder's order (most often ordered first); resolveLines would re-sort by catalog.
  const rows = useMemo(() => (usual?.items ?? []).map(resolveLine).filter((r) => r !== null), [usual]);
  if (!usual || rows.length === 0) return null;

  const customer = customerLabel(customerRaw);
  const days = daysSince(usual.lastAt);
  const when = days === 0 ? t.today : days === 1 ? t.yesterday : plural(locale, days, t.daysAgo);
  const qtyOf = (key: string, fallback: number) => changed[key] ?? fallback;
  const proposal: OrderLine[] = rows.map((r) => ({ slug: r.slug, amount: r.amount, qty: qtyOf(`${r.slug}.${r.amount}`, r.qty) })).filter((l) => l.qty > 0);
  const boxes = proposal.reduce((sum, l) => sum + l.qty, 0);
  const onList = proposal.length > 0 && proposal.every((p) => list.some((l) => l.slug === p.slug && l.amount === p.amount && l.qty === p.qty));
  const visible = expanded ? rows : rows.slice(0, SHOWN);

  const action = onList ? (
    <Link href={`/${locale}/list/`} data-usual-order className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full bg-leaf-dark px-5 py-2 leading-tight font-extrabold text-white transition hover:bg-leaf">
      ✓ {t.done} · {t.order} →
    </Link>
  ) : (
    <button
      type="button"
      data-usual-add
      disabled={proposal.length === 0}
      onClick={() => applyLines(proposal)}
      className="inline-flex min-h-12 max-w-full items-center rounded-full bg-brand px-5 py-2 text-left leading-tight font-extrabold text-white shadow-md transition hover:bg-navy disabled:bg-line disabled:text-slate disabled:shadow-none"
    >
      {t.add} · {plural(locale, proposal.length, dict.list.products)}, {plural(locale, boxes, dict.list.boxes)}
    </button>
  );

  return (
    <section data-usual aria-labelledby="usual-title" className="rounded-3xl border border-line bg-white p-4 text-navy shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-brand" data-usual-welcome>
            {customer ? fill(t.welcome, { name: customer }) : t.welcomeAnon}
          </p>
          <h2 id="usual-title" className="text-2xl leading-tight font-black">
            {t.title}
          </h2>
          <p className="text-sm font-bold text-slate">{fill(t.basis, { orders: plural(locale, usual.orders, t.orders), when })}</p>
        </div>
        {action}
      </div>

      <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((r) => {
          const key = `${r.slug}.${r.amount}`;
          const qty = qtyOf(key, r.qty);
          const label = r.product.flavour?.[locale] ?? r.product.short?.[locale] ?? r.product.name[locale];
          const title = `${r.product.name[locale]}, ${formatSize(r.size, dict)}`;
          return (
            <li key={key} data-usual-row={key} className={`flex items-center gap-2.5 rounded-2xl border border-line p-2 transition ${qty === 0 ? "opacity-55" : ""}`}>
              <span className="tint-tile block size-12 shrink-0 overflow-hidden rounded-xl p-0.5" style={tintStyle(r.product.tint) as CSSProperties}>
                <img src={webpPath(r.size.image, "shelf")} alt="" width={48} height={48} decoding="async" className="size-full object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-tight font-extrabold">{label}</span>
                <span className="block truncate text-xs font-bold text-slate">
                  {formatSize(r.size, dict)} · {fill(t.usually, { boxes: plural(locale, r.qty, dict.list.boxes) })}
                </span>
              </span>
              <Stepper qty={qty} locale={locale} label={title} onChange={(n) => setChanged((c) => ({ ...c, [key]: Math.min(Math.max(n, 0), 999) }))} />
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm font-bold text-slate">
        <span>{t.hint}</span>
        {rows.length > SHOWN && !expanded ? (
          <button type="button" onClick={() => setExpanded(true)} className="min-h-10 font-extrabold text-brand underline underline-offset-2">
            {plural(locale, rows.length - SHOWN, t.more)}
          </button>
        ) : (
          <Link href={`/${locale}/catalog/`} className="min-h-10 content-center font-extrabold text-brand hover:underline">
            {t.other} →
          </Link>
        )}
      </div>
    </section>
  );
}
