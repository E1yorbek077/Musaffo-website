"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stepper } from "./AddToList";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { OrderForm } from "./OrderForm";
import { Receipt } from "./Receipt";
import { RepeatLastOrder } from "./RepeatLastOrder";
import { getDictionary, type Locale } from "@/i18n";
import { formatFat, formatSize, plural, webpPath } from "@/lib/format";
import { useOnline } from "@/lib/offline";
import {
  clearList,
  customerLabel,
  decodeLines,
  encodeLines,
  listAsText,
  listTotals,
  mergeIntoList,
  perBoxLabel,
  rememberLastOrder,
  resolveLines,
  setQty,
  useLastOrder,
  useOrderList,
  type OrderLine,
  type ResolvedLine,
} from "@/lib/order-list";

const ACTION = "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 font-extrabold transition";

export function OrderListPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const own = useOrderList();
  const online = useOnline();
  const [mounted, setMounted] = useState(false);
  const [shared, setShared] = useState<OrderLine[] | null>(null);
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");
  const [today, setToday] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const [placedFor, setPlacedFor] = useState("");
  const lastOrder = useLastOrder();

  // A link from someone else shows their list without touching this visitor's own.
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("l");
    const decoded = encoded ? decodeLines(encoded) : [];
    // The static HTML can't know the URL or date, so they can only be read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShared(decoded.length > 0 ? decoded : null);
    const now = new Date();
    setToday(`${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`);
    setMounted(true);
  }, []);

  const lines = shared ?? own;
  const resolved = useMemo(() => resolveLines(lines), [lines]);
  const totals = listTotals(resolved);

  // The page shrinks a lot when the list empties. Staying scrolled down would leave the
  // empty message and its buttons hidden under the sticky header on a phone.
  const isEmpty = resolved.length === 0;
  const wasEmpty = useRef(isEmpty);
  useEffect(() => {
    if (isEmpty && !wasEmpty.current) window.scrollTo({ top: 0, behavior: "instant" });
    wasEmpty.current = isEmpty;
  }, [isEmpty]);

  const link = mounted ? `${window.location.origin}/${locale}/list/?l=${encodeLines(resolved)}` : "";
  const text = `${listAsText(resolved, locale)}\n\n${link}`;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
    window.setTimeout(() => setCopy("idle"), 2500);
  };

  const acceptShared = () => {
    if (shared) mergeIntoList(shared);
    setShared(null);
    window.history.replaceState(window.history.state, "", window.location.pathname);
  };

  if (!mounted) return <div className="min-h-96" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">
      <div className="hidden items-center justify-between border-b-2 border-brand pb-3 print:flex">
        <img src="/brand/logo.svg" alt="Musaffo" width={138} height={43} className="h-12 w-auto" />
        <span className="font-bold">{today}</span>
      </div>

      <h1 className="text-3xl font-black text-brand sm:text-4xl print:mt-4 print:text-2xl">
        {shared ? dict.list.sharedTitle : dict.list.title}
      </h1>

      {formOpen && (
        <OrderForm
          locale={locale}
          lines={resolved}
          onClose={() => setFormOpen(false)}
          onPlaced={(orderNumber) => {
            // The fresh slip names who ordered, from the details the form just saved; the history itself keeps no names.
            let saved: string | null = null;
            try {
              saved = window.localStorage.getItem("musaffo-customer-v1");
            } catch {
              // No storage: the slip just doesn't name the shop.
            }
            setPlacedFor(customerLabel(saved));
            rememberLastOrder(orderNumber, resolved);
            clearList();
            setPlaced(orderNumber);
            setFormOpen(false);
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {placed && resolved.length === 0 ? (
        <div data-order-success className="mt-6 rounded-3xl bg-leaf-soft px-4 pt-6 pb-8 sm:px-8">
          <div role="status" className="mx-auto flex max-w-xl items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-leaf-dark text-white">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-lg leading-snug font-black text-balance text-leaf-dark sm:text-xl">{dict.order.success}</p>
          </div>
          <div className="mt-6">
            {lastOrder?.orderNumber === placed ? (
              <Receipt
                order={lastOrder}
                customer={placedFor}
                locale={locale}
                fresh
                actions={
                  <Link
                    href={`/${locale}/catalog/`}
                    className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-6 font-extrabold text-brand transition hover:bg-mist"
                  >
                    {dict.list.emptyCta}
                  </Link>
                }
              />
            ) : (
              // Storage blocked: the order went through but there is nothing saved to draw a receipt from.
              <p data-order-number className="text-center text-2xl font-black tracking-wide text-navy tabular-nums">
                {placed}
              </p>
            )}
          </div>
          <p className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-center">
            <Link href={`/${locale}/orders/`} data-orders-entry className="font-extrabold text-leaf-dark underline underline-offset-4 hover:text-navy">
              {dict.orders.title} →
            </Link>
            <Link href={`/${locale}/labels/?from=last`} data-labels-entry className="font-extrabold text-leaf-dark underline underline-offset-4 hover:text-navy">
              {dict.labels.entryHint} →
            </Link>
          </p>
        </div>
      ) : resolved.length === 0 ? (
        <>
          <div className="mt-6 empty:hidden">
            <RepeatLastOrder locale={locale} />
          </div>
          <div className="mt-6 rounded-3xl bg-linear-to-br from-mist to-sky-soft/60 px-6 py-14 text-center">
            <p className="text-xl font-black text-brand">{dict.list.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md font-semibold text-pretty text-slate">{dict.list.emptyHint}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href={`/${locale}/catalog/`}
                className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 font-extrabold text-white transition hover:bg-brand-bright"
              >
                {dict.list.emptyCta}
              </Link>
              <Link
                href={`/${locale}/quick/`}
                className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-7 font-extrabold text-brand transition hover:bg-mist"
              >
                {dict.quick.title}
              </Link>
            </div>
            <Link href={`/${locale}/quick/#paste`} data-paste-entry className="mt-4 inline-block font-extrabold text-brand underline underline-offset-4 hover:text-navy">
              {dict.paste.entry} →
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start print:mt-3 print:block">
          <ul className="space-y-3 print:space-y-0">
            {resolved.map((r) => (
              <Row key={`${r.slug}.${r.amount}`} line={r} locale={locale} readOnly={shared !== null} />
            ))}
          </ul>

          <aside className="space-y-3 rounded-3xl border border-line bg-white p-5 shadow-card lg:sticky lg:top-20 print:mt-4 print:rounded-none print:border-0 print:border-t-2 print:border-brand print:p-0 print:pt-3 print:shadow-none">
            <h2 className="text-lg font-black text-brand">{dict.list.total}</h2>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Total value={totals.products} label={plural(locale, totals.products, dict.list.productsLabel)} />
              <Total value={totals.boxes} label={plural(locale, totals.boxes, dict.list.boxesLabel)} />
              <Total value={totals.pieces} label={dict.list.piecesLabel} />
            </dl>

            <div className="space-y-2 pt-1 print:hidden">
              {shared && (
                <button type="button" onClick={acceptShared} className={`${ACTION} bg-leaf-dark text-white hover:bg-leaf`}>
                  {dict.list.merge}
                </button>
              )}
              {/* A list opened from someone's link has to become the visitor's own before it can be ordered. */}
              {!shared &&
                (online ? (
                  <button type="button" data-place-order onClick={() => setFormOpen(true)} className={`${ACTION} bg-brand text-white shadow-md hover:bg-brand-bright`}>
                    {dict.order.place}
                  </button>
                ) : (
                  <p data-send-offline className="rounded-2xl bg-mist px-4 py-3 text-sm font-bold text-pretty text-navy">
                    {dict.order.offline}
                  </p>
                ))}
              <button type="button" onClick={copyText} className={`${ACTION} border-2 border-brand text-brand hover:bg-mist`}>
                <span aria-live="polite">
                  {copy === "done" ? dict.list.copied : copy === "failed" ? dict.list.copyFailed : dict.list.copy}
                </span>
              </button>
              <button type="button" onClick={() => window.print()} className={`${ACTION} border-2 border-brand text-brand hover:bg-mist`}>
                {dict.list.print}
              </button>
              <Link href={`/${locale}/labels/?from=list`} data-labels-entry className={`${ACTION} border-2 border-brand text-brand hover:bg-mist`}>
                {dict.labels.entry}
              </Link>
              {!shared && (
                <button type="button" onClick={clearList} className="min-h-11 w-full font-bold text-slate underline-offset-2 hover:text-brand hover:underline">
                  {dict.list.clear}
                </button>
              )}
            </div>

            <p className="text-sm font-semibold text-pretty text-slate print:hidden">{shared ? dict.list.sharedNote : dict.list.note}</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Total({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-mist px-1 py-3 print:bg-transparent print:py-1">
      <dd className="text-2xl font-black text-brand tabular-nums">{value}</dd>
      <dt className="text-xs font-bold text-slate">{label}</dt>
    </div>
  );
}

function Row({ line, locale, readOnly }: { line: ResolvedLine; locale: Locale; readOnly: boolean }) {
  const dict = getDictionary(locale);
  const { product, size, qty, pieces } = line;
  const name = product.name[locale];
  const sizeText = formatSize(size, dict);
  const href = `/${locale}/products/${product.slug}/`;

  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-white p-3 sm:gap-4 print:break-inside-avoid print:rounded-none print:border-0 print:border-b print:px-0 print:py-2">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-linear-to-b from-mist to-white p-1.5 sm:size-24 print:size-12 print:bg-none">
        <picture className="flex h-full w-full items-center justify-center">
          <source srcSet={webpPath(size.image, "shelf")} type="image/webp" />
          <img src={size.image} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
        </picture>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <LineBadge line={product.line} />
            <h2 className="mt-1 leading-snug font-extrabold text-navy">
              <Link href={href} className="hover:text-brand hover:underline">
                {name}
              </Link>
            </h2>
            <p className="text-sm font-bold text-slate">
              {formatFat(product.fatPercent, locale)} · {sizeText} · {perBoxLabel(size, locale)}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setQty(product.slug, size.amount, 0)}
              aria-label={`${dict.list.remove}: ${name}, ${sizeText}`}
              className="-mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-slate hover:bg-mist hover:text-brand print:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {readOnly ? (
            <span className="font-black text-navy">{plural(locale, qty, dict.list.boxes)}</span>
          ) : (
            <>
              <span className="print:hidden">
                <Stepper qty={qty} locale={locale} label={`${name}, ${sizeText}`} onChange={(next) => setQty(product.slug, size.amount, next)} />
              </span>
              <span className="hidden font-black text-navy print:inline">{plural(locale, qty, dict.list.boxes)}</span>
            </>
          )}
          <span className="font-extrabold text-brand" aria-live="polite">
            {plural(locale, pieces, dict.list.pieces)}
          </span>
        </div>
      </div>
    </li>
  );
}
