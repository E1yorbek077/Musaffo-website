"use client";

import { useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "./Link";
import { lineLabels, LineBadge } from "./LineBadge";
import { Stepper } from "./AddToList";
import type { Product, ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSize, plural, webpPath } from "@/lib/format";
import { mergeIntoList, useOrderList, type OrderLine } from "@/lib/order-list";
import { boxesFor, parseOrderText, type ParsedLine } from "@/lib/parse-order";
import { tintStyle } from "@/lib/tints";

/** More than this many equally good matches isn't a choice, it's a category: ask for the flavour instead. */
const MAX_CHOICES = 12;

type Override = { slug?: string; amount?: number; boxes?: number; removed?: boolean };

type Matched = {
  state: "choose" | "size" | "ready";
  line: ParsedLine;
  key: string;
  product: Product | null;
  size: ProductSize | null;
  boxes: number;
  qtyGiven: boolean;
};
type Ready = Matched & { state: "ready"; product: Product; size: ProductSize };
type Resolved = { state: "chatter" | "unknown" | "vague"; line: ParsedLine; key: string } | Matched;

const isReady = (r: Resolved): r is Ready => r.state === "ready";
const isMatched = (r: Resolved): r is Matched => r.state === "choose" || r.state === "size" || r.state === "ready";

function resolve(line: ParsedLine, key: string, o: Override): Resolved {
  if (line.candidates.length === 0) return { state: line.chatter ? "chatter" : "unknown", line, key };
  if (line.candidates.length > MAX_CHOICES) return { state: "vague", line, key };
  // Words left out to find a match ("sour" in "sour cream") mean even a single match waits for a tap.
  const sure = line.candidates.length === 1 && line.ignored.length === 0;
  const product = line.candidates.find((p) => p.slug === o.slug) ?? (sure ? line.candidates[0] : null);
  let size: ProductSize | null = null;
  if (product) {
    const named = line.sizes[product.slug] ?? [];
    const amount = o.amount ?? (product.sizes.length === 1 ? product.sizes[0].amount : named.length === 1 ? named[0] : null);
    size = product.sizes.find((s) => s.amount === amount) ?? null;
  }
  const fromText = size ? boxesFor(line, size.piecesPerBox) : line.boxes;
  return {
    state: !product ? "choose" : !size ? "size" : "ready",
    line,
    key,
    product,
    size,
    boxes: o.boxes ?? fromText ?? 1,
    qtyGiven: fromText !== null || o.boxes !== undefined,
  };
}

/** The shortest label that tells lookalikes apart: only what differs between them (brand, kind, flavour, fat). */
function choiceLabel(product: Product, all: Product[], locale: Locale): string {
  const dict = getDictionary(locale);
  const differs = (pick: (p: Product) => unknown) => new Set(all.map(pick)).size > 1;
  const flavour = product.flavour?.[locale] ?? product.short?.[locale] ?? product.name[locale];
  const fat = formatFat(product.fatPercent, locale);
  const parts = [
    differs((p) => p.line) && lineLabels[product.line],
    differs((p) => p.category) && dict.categories[product.category],
    differs((p) => p.flavour?.[locale] ?? p.short?.[locale] ?? p.name[locale]) && flavour,
    differs((p) => p.fatPercent) && !flavour.includes(fat) && fat,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : product.name[locale];
}

const noSubscribe = () => () => {};

/**
 * Orders as people already write them: pasted from a chat, typed in one go, or dictated with the keyboard's
 * microphone. Each line is read as it's typed (lib/parse-order.ts) and shown as a product with its boxes;
 * anything unclear asks for one tap instead of guessing. Also where the installed app's share target lands.
 */
export function PasteOrder({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.paste;
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [added, setAdded] = useState<{ products: number; boxes: number } | null>(null);
  const deferred = useDeferredValue(text);
  // The order bar sits at the bottom of the screen once the list has something in it.
  const barShown = useOrderList().length > 0;
  const canPaste = useSyncExternalStore(noSubscribe, () => typeof navigator.clipboard?.readText === "function", () => false);

  // Text shared into the installed app (manifest share_target) or sent as a link: /uz/quick/?text=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = [params.get("title"), params.get("text")].filter(Boolean).join("\n");
    if (!shared) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
    setText(shared.slice(0, 5000));
    params.delete("title");
    params.delete("text");
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}#paste`);
    document.getElementById("paste")?.scrollIntoView({ block: "start" });
  }, []);

  const resolved = useMemo(
    () => parseOrderText(deferred).map((line, i) => resolve(line, `${i}|${line.text}`, overrides[`${i}|${line.text}`] ?? {})),
    [deferred, overrides],
  );
  const visible = resolved.filter((r) => r.state !== "chatter" && !overrides[r.key]?.removed);
  const skipped = resolved.filter((r) => r.state === "chatter").map((r) => r.line.text);
  const ready = visible.filter(isReady);
  const waiting = visible.filter((r) => r.state === "choose" || r.state === "size").length;
  const boxes = ready.reduce((sum, r) => sum + r.boxes, 0);
  const products = new Set(ready.map((r) => `${r.product.slug}.${r.size.amount}`)).size;

  const override = (key: string, change: Override) => setOverrides((all) => ({ ...all, [key]: { ...all[key], ...change } }));
  const edit = (value: string) => {
    setText(value);
    setAdded(null);
  };

  const add = () => {
    const lines: OrderLine[] = ready.map((r) => ({ slug: r.product.slug, amount: r.size.amount, qty: r.boxes }));
    mergeIntoList(lines);
    setAdded({ products, boxes });
    // What's left in the box is only what still needs attention.
    setText(visible.filter((r) => r.state !== "ready").map((r) => r.line.text).join("\n"));
    setOverrides({});
  };

  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) edit(text.trim() ? `${text.trimEnd()}\n${clip}` : clip);
    } catch {
      // Permission refused: the visitor can still paste with the keyboard.
    }
  };

  return (
    <section id="paste" data-paste-order aria-labelledby="paste-title" className="scroll-mt-20 rounded-3xl border-2 border-sky/40 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-mist text-brand">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v10H9l-5 4z" />
            <path d="M8 9h8M8 12h5" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 id="paste-title" className="text-lg leading-snug font-black text-navy">
            {t.title}
          </h2>
          <p className="text-sm font-semibold text-pretty text-slate">{t.hint}</p>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="sr-only">{t.label}</span>
        <textarea
          data-paste-input
          value={text}
          onChange={(e) => edit(e.target.value)}
          placeholder={t.placeholder}
          rows={4}
          maxLength={5000}
          spellCheck={false}
          autoCapitalize="sentences"
          enterKeyHint="enter"
          className="paste-input block max-h-[50vh] min-h-28 w-full resize-y rounded-2xl border border-line bg-mist/40 px-4 py-3 font-semibold text-navy placeholder:font-medium placeholder:text-slate/80 focus:border-sky focus:bg-white"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canPaste && (
          <button type="button" data-paste-clipboard onClick={paste} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-mist px-4 text-sm font-extrabold text-brand transition hover:bg-sky/20">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="12" height="17" rx="2" />
              <path d="M9 4h6v3H9z" />
            </svg>
            {t.paste}
          </button>
        )}
        {text && (
          <button type="button" onClick={() => edit("")} className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-extrabold text-slate transition hover:bg-mist">
            {t.clear}
          </button>
        )}
        <p className="flex min-w-0 flex-1 basis-56 items-center gap-1.5 text-xs font-semibold text-slate">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          {t.voice}
        </p>
      </div>

      {added && (
        <p data-paste-added role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-leaf-soft/70 px-4 py-3 font-extrabold text-leaf-dark">
          <span>✓ {fill(t.added, { products: plural(locale, added.products, dict.list.products), boxes: plural(locale, added.boxes, dict.list.boxes) })}</span>
          <Link href={`/${locale}/list/`} className="underline underline-offset-2">
            {t.openList}
          </Link>
        </p>
      )}

      {visible.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {visible.map((r) => (
            <PastedLine key={r.key} r={r} locale={locale} onChange={(change) => override(r.key, change)} />
          ))}
        </ul>
      )}
      {skipped.length > 0 && <p className="mt-2 truncate text-xs font-semibold text-slate">{fill(t.skipped, { lines: skipped.join(" · ") })}</p>}

      {visible.length > 0 && (
        <div className={`sticky z-10 mt-3 ${barShown ? "bottom-[5.75rem]" : "bottom-2"} flex items-center justify-between gap-3 rounded-2xl bg-white px-2 py-2 shadow-[0_-6px_16px_-8px_rgb(0_40_90/0.25)] -mx-2`}>
          <p className="min-w-0 text-xs leading-snug font-bold text-slate sm:text-sm">
            {ready.length > 0 && (
              <span className="block font-extrabold text-navy">
                {plural(locale, products, dict.list.products)} · {plural(locale, boxes, dict.list.boxes)}
              </span>
            )}
            {waiting > 0 && <span data-paste-waiting>{plural(locale, waiting, t.waiting)}</span>}
          </p>
          <button
            type="button"
            data-paste-add
            disabled={ready.length === 0}
            onClick={add}
            className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-brand px-5 font-extrabold text-white shadow-md sm:px-6 transition hover:bg-navy disabled:bg-line disabled:text-slate disabled:shadow-none"
          >
            {t.add}
          </button>
        </div>
      )}
    </section>
  );
}

function PastedLine({ r, locale, onChange }: { r: Resolved; locale: Locale; onChange: (change: Override) => void }) {
  const dict = getDictionary(locale);
  const t = dict.paste;
  const remove = (
    <button
      type="button"
      onClick={() => onChange({ removed: true })}
      aria-label={`${dict.list.remove}: ${r.line.text}`}
      className="grid size-9 shrink-0 place-items-center rounded-full text-xl font-black text-slate transition hover:bg-mist hover:text-navy"
    >
      ×
    </button>
  );
  const quote = <p className="truncate text-xs font-semibold text-slate">«{r.line.text}»</p>;

  if (!isMatched(r)) {
    if (r.state === "chatter") return null;
    return (
      <li data-paste-line data-state={r.state} className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-3 py-2">
        <div className="min-w-0 flex-1">
          {quote}
          <p className="text-sm font-extrabold text-immun">{r.state === "vague" ? t.vague : t.unknown}</p>
        </div>
        {remove}
      </li>
    );
  }

  const { product, size, boxes, qtyGiven } = r;
  const shown = product ?? r.line.candidates[0];
  const image = (size ?? shown.sizes[0]).image;
  const pieces = r.line.pieces;

  return (
    // One row when there's room (name · boxes · ×); on a phone the boxes wrap under the name.
    <li
      data-paste-line
      data-state={r.state}
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-2 py-2 sm:px-3 ${r.state === "ready" ? "border-line bg-white" : "border-sky bg-mist/50"}`}
    >
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-2.5">
        <span className="tint-tile block size-12 shrink-0 overflow-hidden rounded-lg p-0.5" style={tintStyle(shown.tint) as CSSProperties}>
          <img src={webpPath(image, "shelf")} alt="" width={48} height={48} loading="lazy" decoding="async" className={`size-full object-contain ${product ? "" : "opacity-40"}`} />
        </span>
        <div className="min-w-0 flex-1">
          {quote}
          {product ? (
            <p className="leading-tight font-extrabold text-navy">
              <span className="mr-1.5 align-middle">
                <LineBadge line={product.line} />
              </span>
              {product.name[locale]}
              {size && <span className="font-bold text-slate">, {formatSize(size, dict)}</span>}
            </p>
          ) : (
            <p className="font-extrabold text-brand">{r.line.ignored.length > 0 ? fill(t.unsure, { words: r.line.ignored.join(" ") }) : t.choose}</p>
          )}
          {r.state === "ready" && pieces !== null && r.line.boxes === null && size && (
            <p className="text-xs font-extrabold text-brand" data-paste-pieces>
              {fill(t.fromPieces, { pieces: plural(locale, pieces, dict.list.pieces), boxes: plural(locale, boxes, dict.list.boxes) })} ·{" "}
              {fill(dict.list.perBox, { count: size.piecesPerBox })}
            </p>
          )}
          {r.state === "ready" && !qtyGiven && <p className="text-xs font-extrabold text-immun">{t.noQty}</p>}
        </div>
      </div>
      {r.state === "ready" && product && size && (
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-bold whitespace-nowrap text-slate">{plural(locale, boxes * size.piecesPerBox, dict.list.pieces)}</span>
          <Stepper qty={boxes} locale={locale} label={`${product.name[locale]}, ${formatSize(size, dict)}`} onChange={(n) => (n < 1 ? onChange({ removed: true }) : onChange({ boxes: Math.min(n, 999) }))} />
        </div>
      )}
      {remove}

      {r.state === "choose" && (
        <div className="stage-chips flex basis-full gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap" role="group" aria-label={t.choose}>
          {r.line.candidates.map((p) => (
            <button
              key={p.slug}
              type="button"
              data-paste-choice={p.slug}
              onClick={() => onChange({ slug: p.slug })}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full border-2 border-brand/30 bg-white px-3.5 text-sm font-extrabold whitespace-nowrap text-brand transition hover:border-brand"
            >
              {choiceLabel(p, r.line.candidates, locale)}
            </button>
          ))}
        </div>
      )}
      {r.state === "size" && product && (
        <div className="flex basis-full flex-wrap gap-1.5" role="group" aria-label={t.chooseSize}>
          <span className="self-center text-sm font-extrabold text-brand">{t.chooseSize}</span>
          {product.sizes.map((s) => (
            <button
              key={s.amount}
              type="button"
              data-paste-size={s.amount}
              onClick={() => onChange({ amount: s.amount })}
              className="inline-flex min-h-10 items-center rounded-full border-2 border-brand/30 bg-white px-3.5 text-sm font-extrabold text-brand transition hover:border-brand"
            >
              {formatSize(s, dict)}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
