"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { lineLabels } from "./LineBadge";
import type { Product, ProductSize } from "@/data/products";
import { products } from "@/data/products";
import { getDictionary, locales, type Locale } from "@/i18n";
import { formatFat, formatSize, plural, webpPath } from "@/lib/format";
import {
  addLabels,
  clearLabels,
  formatPrice,
  labelKey,
  LAYOUTS,
  MAX_PRICE,
  parseKey,
  removeLabel,
  setLabelOptions,
  setPrice,
  useLabels,
  type LabelSize,
} from "@/lib/labels";
import { useLastOrder, useOrderList } from "@/lib/order-list";
import { qrPath, scanUrl } from "@/lib/qr";
import { searchProducts } from "@/lib/search";
import { tintStyle } from "@/lib/tints";

const ALL_KEYS = products.flatMap((p) =>
  p.sizes.map((s) => labelKey(p.slug, s.amount)),
);
const noSubscribe = () => () => {};
const LANGUAGE_NAMES: Record<Locale, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

/** One shelf label. Sizes are relative to the label's own width, so the preview and the print match exactly. */
export function PriceLabel({
  product,
  size,
  price,
  language,
  qrOrigin = null,
}: {
  product: Product;
  size: ProductSize;
  price: number | null;
  language: Locale;
  /** Site address the QR code opens; null prints no code. */
  qrOrigin?: string | null;
}) {
  const dict = getDictionary(language);
  const name = product.name[language];
  const fat = formatFat(product.fatPercent, language);
  const meta = [formatSize(size, dict), !name.includes(fat) && fat]
    .filter(Boolean)
    .join(" · ");
  const code = qrOrigin
    ? scanUrl(qrOrigin, language, product.slug, size.amount)
    : null;
  const qr = useMemo(() => (code ? qrPath(code) : null), [code]);
  return (
    <article
      data-price-label
      className="price-label"
      style={tintStyle(product.tint) as CSSProperties}
    >
      {/* The label is the size container; its own styles can't use its width, so the layout lives one level in. */}
      <div className="price-label-grid" data-qr={qr ? "" : undefined}>
        {qr && code && (
          // Scanned with any phone camera when the shelf runs low: opens the scan page, which adds a box to the order.
          <span className="price-label-qr" data-label-qr={code}>
            <svg
              viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
              shapeRendering="crispEdges"
              role="img"
              aria-label={dict.labels.qrAlt}
            >
              <rect
                x="-2"
                y="-2"
                width={qr.size + 4}
                height={qr.size + 4}
                fill="#fff"
              />
              <path d={qr.path} fill="#0a2f57" />
            </svg>
          </span>
        )}
        <div className="price-label-band">
          <img
            src="/brand/logo.svg"
            alt="Musaffo"
            className="price-label-logo"
          />
          {product.line !== "musaffo" && (
            <span className="price-label-line">{lineLabels[product.line]}</span>
          )}
        </div>
        <div className="price-label-body">
          <span className="price-label-pack">
            <img src={webpPath(size.image, "thumb")} alt="" />
          </span>
          <div className="price-label-text">
            <p className="price-label-name">{name}</p>
            <p className="price-label-meta">{meta}</p>
          </div>
        </div>
        <div className="price-label-price">
          {price ? (
            <strong data-label-price>{formatPrice(price)}</strong>
          ) : (
            <span className="price-label-blank" aria-hidden="true" />
          )}
          <span className="price-label-currency">{dict.labels.currency}</span>
          <span className="price-label-per">{dict.labels.perPiece}</span>
        </div>
      </div>
    </article>
  );
}

export function PriceLabels({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.labels;
  const labels = useLabels();
  const list = useOrderList();
  const last = useLastOrder();
  const [query, setQuery] = useState("");
  const language = labels.language ?? locale;
  // The codes open the site the labels were printed from. Known only in the browser, so the server renders none.
  const origin = useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
  const layout = LAYOUTS[labels.size];
  const perSheet = layout.columns * layout.rows;

  const items = labels.items.flatMap((key) => {
    const found = parseKey(key);
    return found ? [{ key, ...found }] : [];
  });
  const sheets = Array.from(
    { length: Math.ceil(items.length / perSheet) },
    (_, i) => items.slice(i * perSheet, (i + 1) * perSheet),
  );
  const listKeys = useMemo(
    () => list.map((l) => labelKey(l.slug, l.amount)),
    [list],
  );
  const lastKeys = useMemo(
    () => last?.lines.map((l) => labelKey(l.slug, l.amount)) ?? [],
    [last],
  );

  // Arriving from the order list or the success screen (?from=list / ?from=last) brings those products along, once.
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    const from = new URLSearchParams(window.location.search).get("from");
    const keys = from === "list" ? listKeys : from === "last" ? lastKeys : [];
    if (!from) arrived.current = true;
    if (keys.length === 0) return;
    arrived.current = true;
    addLabels(keys);
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, [listKeys, lastKeys]);

  const results = useMemo(
    () =>
      query.trim()
        ? searchProducts(query)
            .slice(0, 6)
            .flatMap((hit) =>
              hit.product.sizes
                .filter((s) => !hit.sizes || hit.sizes.includes(s.amount))
                .map((size) => ({ product: hit.product, size })),
            )
        : [],
    [query],
  );

  const sourceButton = (label: string, keys: string[], data: string) =>
    keys.length > 0 && (
      <button
        type="button"
        data-labels-source={data}
        onClick={() => addLabels(keys)}
        disabled={keys.every((k) => labels.items.includes(k))}
        className="inline-flex min-h-11 items-center rounded-full border-2 border-brand bg-white px-4 font-extrabold text-brand transition hover:bg-mist disabled:border-line disabled:text-slate"
      >
        {label}
      </button>
    );

  return (
    <div
      data-price-labels
      className="mx-auto max-w-6xl px-3 pt-6 pb-10 sm:px-6 sm:pt-8 print:p-0"
    >
      <div className="print:hidden">
        <h1 className="text-3xl font-black text-brand sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-1 max-w-3xl font-semibold text-pretty text-slate">
          {t.hint}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {sourceButton(t.fromList, listKeys, "list")}
          {sourceButton(t.fromLast, lastKeys, "last")}
          {sourceButton(t.all, ALL_KEYS, "all")}
        </div>

        <label className="mt-3 block max-w-xl">
          <span className="sr-only">{t.searchLabel}</span>
          <input
            type="search"
            data-labels-search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-12 w-full rounded-2xl border border-line bg-white px-4 font-semibold text-navy placeholder:font-medium placeholder:text-slate/80 focus:border-sky"
          />
        </label>
        {results.length > 0 && (
          <div className="mt-2 flex max-w-3xl flex-wrap gap-1.5">
            {results.map(({ product, size }) => {
              const key = labelKey(product.slug, size.amount);
              const added = labels.items.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  data-labels-add={key}
                  disabled={added}
                  onClick={() => addLabels([key])}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-mist px-3.5 text-sm font-extrabold text-brand transition hover:bg-sky/20 disabled:bg-leaf-soft disabled:text-leaf-dark"
                >
                  {added ? "✓" : "+"}{" "}
                  {product.flavour?.[locale] ??
                    product.short?.[locale] ??
                    product.name[locale]}
                  <span className="font-bold text-slate">
                    {lineLabels[product.line]} · {formatSize(size, dict)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-mist px-6 py-14 text-center print:hidden">
          <p className="text-xl font-extrabold text-brand">{t.emptyTitle}</p>
          <p className="mt-2 font-semibold text-slate">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:gap-x-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start print:mt-0 print:block">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white lg:col-start-2 lg:row-start-1 print:hidden">
            <p className="font-extrabold text-navy" data-labels-count>
              {plural(locale, items.length, t.count)} ·{" "}
              <span className="text-slate">
                {plural(locale, sheets.length, t.sheets)}
              </span>
            </p>
            <button
              type="button"
              data-labels-print
              onClick={() => window.print()}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 font-extrabold text-white shadow-md transition hover:bg-navy"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" />
              </svg>
              {t.print}
            </button>
          </div>
          <section
            className="lg:col-start-1 lg:row-span-2 lg:row-start-1 print:hidden"
            aria-label={t.price}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl bg-mist/60 p-3">
              <fieldset>
                <legend className="text-sm font-extrabold text-navy">
                  {t.size}
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(["large", "small"] as LabelSize[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={labels.size === s}
                      data-labels-size={s}
                      onClick={() => setLabelOptions({ size: s })}
                      className={`min-h-10 rounded-full px-3.5 text-sm font-extrabold transition ${labels.size === s ? "bg-brand text-white" : "bg-white text-brand"}`}
                    >
                      {s === "large" ? t.sizeLarge : t.sizeSmall}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-extrabold text-navy">
                  {t.language}
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {locales.map((l) => (
                    <button
                      key={l}
                      type="button"
                      lang={l}
                      aria-pressed={language === l}
                      data-labels-language={l}
                      onClick={() =>
                        setLabelOptions({ language: l === locale ? null : l })
                      }
                      className={`min-h-10 rounded-full px-3.5 text-sm font-extrabold transition ${language === l ? "bg-brand text-white" : "bg-white text-brand"}`}
                    >
                      {LANGUAGE_NAMES[l]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="flex basis-full items-start gap-2.5">
                <input
                  type="checkbox"
                  data-labels-qr
                  checked={labels.qr}
                  onChange={(e) => setLabelOptions({ qr: e.target.checked })}
                  className="mt-0.5 size-5 shrink-0 accent-brand"
                />
                <span>
                  <span className="block text-sm font-extrabold text-navy">
                    {t.qr}
                  </span>
                  <span className="block text-sm font-semibold text-pretty text-slate">
                    {t.qrHint}
                  </span>
                </span>
              </label>
            </div>

            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
              {items.map(({ key, product, size }) => {
                const price = labels.prices[key];
                const title = `${product.name[locale]}, ${formatSize(size, dict)}`;
                return (
                  <li
                    key={key}
                    data-labels-row={key}
                    className="flex items-center gap-2.5 py-1.5 pr-1.5 pl-2"
                  >
                    <span
                      className="tint-tile block size-11 shrink-0 overflow-hidden rounded-lg p-0.5"
                      style={tintStyle(product.tint) as CSSProperties}
                    >
                      <img
                        src={webpPath(size.image, "shelf")}
                        alt=""
                        width={44}
                        height={44}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate leading-tight font-extrabold text-navy">
                        {product.flavour?.[locale] ??
                          product.short?.[locale] ??
                          product.name[locale]}
                      </span>
                      <span className="block truncate text-xs font-bold text-slate">
                        {lineLabels[product.line]} · {formatSize(size, dict)} ·{" "}
                        {formatFat(product.fatPercent, locale)}
                      </span>
                    </span>
                    <label className="shrink-0">
                      <span className="sr-only">
                        {t.price}: {title}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        data-labels-price={key}
                        placeholder={t.currency}
                        value={price ? formatPrice(price) : ""}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, String(MAX_PRICE).length);
                          setPrice(key, digits ? Number(digits) : null);
                        }}
                        className="h-11 w-28 rounded-xl border border-line bg-white px-3 text-right font-black text-navy tabular-nums placeholder:font-semibold placeholder:text-slate/70 focus:border-sky"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeLabel(key)}
                      aria-label={`${dict.list.remove}: ${title}`}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-xl font-black text-slate transition hover:bg-mist hover:text-navy"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-sm font-semibold text-slate">{t.saved}</p>
            <button
              type="button"
              onClick={clearLabels}
              className="mt-1 min-h-11 font-bold text-slate underline-offset-2 hover:text-brand hover:underline"
            >
              {t.clear}
            </button>
          </section>

          <section
            aria-label={t.preview}
            className="lg:sticky lg:top-20 lg:col-start-2 lg:row-start-2"
          >
            {/* On wide screens the preview scrolls on its own; focusable so the keyboard can scroll it too. */}
            <div
              tabIndex={0}
              className="mt-3 space-y-4 rounded-xl lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1 print:mt-0 print:max-h-none print:space-y-0 print:overflow-visible"
            >
              {sheets.map((sheet, i) => (
                <div
                  key={i}
                  data-label-sheet
                  data-size={labels.size}
                  lang={language}
                  className="label-sheet"
                  style={
                    {
                      "--cols": layout.columns,
                      "--rows": layout.rows,
                    } as CSSProperties
                  }
                >
                  {sheet.map(({ key, product, size }) => (
                    <PriceLabel
                      key={key}
                      product={product}
                      size={size}
                      price={labels.prices[key] ?? null}
                      language={language}
                      qrOrigin={labels.qr ? origin || null : null}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
