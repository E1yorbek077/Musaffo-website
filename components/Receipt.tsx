"use client";

import { useState, type ReactNode } from "react";
import { LineBadge } from "./LineBadge";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSize, plural, webpPath } from "@/lib/format";
import { perBoxLabel, type LastOrder } from "@/lib/order-list";
import { SALES_PHONE } from "@/lib/phone";
import { formatPlacedAt, receiptLines, saveReceiptImage } from "@/lib/receipt";

/**
 * What a shop ordered, as a till-style receipt: the shop's own copy of an order (the bot only messages the manager).
 * It can be saved or forwarded as a picture.
 */
export function Receipt({
  order,
  locale,
  actions,
  customer = "",
  fresh = false,
}: {
  order: LastOrder;
  locale: Locale;
  actions?: ReactNode;
  /** Who ordered; only known right after ordering, since the history keeps no names. */
  customer?: string;
  fresh?: boolean;
}) {
  const dict = getDictionary(locale);
  const t = dict.receipt;
  const { lines, totals } = receiptLines(order);
  const [saving, setSaving] = useState<"idle" | "busy" | "shared" | "downloaded" | "failed">("idle");

  const save = async () => {
    setSaving("busy");
    try {
      const result = await saveReceiptImage(order, locale, customer);
      setSaving(result === "cancelled" ? "idle" : result);
    } catch {
      setSaving("failed");
    }
  };

  return (
    <div data-receipt={order.orderNumber} className="mx-auto w-full max-w-xl">
      <div className={`receipt-shadow ${fresh ? "receipt-print" : ""}`}>
      <article className="receipt" aria-label={`${t.title} ${order.orderNumber}`}>
        <header className="flex items-center justify-between gap-3 bg-brand px-5 pt-5 pb-4 text-white sm:px-7">
          <img src="/brand/logo.svg" alt="Musaffo" width={120} height={37} className="h-9 w-auto" />
          <span className="text-sm font-extrabold">{t.title}</span>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-5 pt-4 sm:px-7">
          <div>
            <p className="text-sm font-bold text-slate">{dict.order.numberLabel}</p>
            <p data-order-number className="text-2xl font-black tracking-wide text-navy tabular-nums sm:text-3xl">
              {order.orderNumber}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-bold text-slate tabular-nums" data-receipt-date>
              {formatPlacedAt(order.placedAt)}
            </p>
            <p className="font-black text-leaf-dark">✓ {t.sent}</p>
          </div>
        </div>
        {customer && (
          <p data-receipt-customer className="truncate px-5 pt-2 font-extrabold text-navy sm:px-7">
            {t.customer}: {customer}
          </p>
        )}

        <ul className="mx-5 mt-4 border-y-2 border-dashed border-line py-2 sm:mx-7">
          {lines.map((r) => (
            <li key={`${r.slug}.${r.amount}`} data-receipt-line={`${r.slug}.${r.amount}.${r.qty}`} className="flex items-center gap-3 py-2">
              <img src={webpPath(r.size.image, "shelf")} alt="" width={48} height={48} loading="lazy" decoding="async" className="size-12 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="leading-tight font-extrabold text-navy">{r.product.name[locale]}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-bold text-slate">
                  <LineBadge line={r.product.line} />
                  {formatFat(r.product.fatPercent, locale)} · {formatSize(r.size, dict)} · {perBoxLabel(r.size, locale)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-black whitespace-nowrap text-navy">{plural(locale, r.qty, dict.list.boxes)}</p>
                <p className="text-sm font-extrabold whitespace-nowrap text-brand">{plural(locale, r.pieces, dict.list.pieces)}</p>
              </div>
            </li>
          ))}
        </ul>

        <p data-receipt-totals className="flex flex-wrap justify-between gap-x-3 px-5 pt-3 font-black text-navy sm:px-7">
          <span>{dict.list.total}</span>
          <span>
            {plural(locale, totals.products, dict.list.products)} · {plural(locale, totals.boxes, dict.list.boxes)} · {plural(locale, totals.pieces, dict.list.pieces)}
          </span>
        </p>
        <p className="px-5 pt-4 text-center text-sm font-bold text-pretty text-slate sm:px-7">{t.next}</p>
        <p className="px-5 pt-1 pb-7 text-center font-black sm:px-7">
          <a href={`tel:${SALES_PHONE.tel}`} className="text-brand underline-offset-2 hover:underline">
            {fill(t.questions, { phone: SALES_PHONE.display })}
          </a>
        </p>
      </article>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
        <button
          type="button"
          data-receipt-save
          onClick={save}
          disabled={saving === "busy"}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-6 font-extrabold text-white shadow-md transition hover:bg-brand disabled:opacity-70"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          {t.save}
        </button>
        {actions}
      </div>
      <p className="mt-2 min-h-6 text-center text-sm font-bold text-slate print:hidden" aria-live="polite" data-receipt-status={saving}>
        {saving === "busy" ? t.saving : saving === "downloaded" ? t.downloaded : saving === "shared" ? t.shared : saving === "failed" ? t.failed : t.saveHint}
      </p>
    </div>
  );
}
