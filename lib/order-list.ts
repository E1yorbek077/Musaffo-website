import { useMemo, useSyncExternalStore } from "react";
import { products, type BrandLine, type Product, type ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { getProduct } from "./catalog";
import { fill, formatFat, formatSize, plural } from "./format";

/**
 * The visitor's order list. There is no backend: the list lives in this browser
 * (localStorage) and travels between people as a URL (?l=slug.amount.qty~...).
 * Quantities are boxes; pieces are derived from each size's piecesPerBox.
 */
export type OrderLine = { slug: string; amount: number; qty: number };
export type ResolvedLine = OrderLine & { product: Product; size: ProductSize; pieces: number };

const STORAGE_KEY = "musaffo-order-list-v1";
const MAX_QTY = 999;
const EMPTY: OrderLine[] = [];

const BRAND_NAMES: Record<BrandLine, string> = { musaffo: "Musaffo", engil: "Engil", immun: "IMMUN+" };

function findSize(slug: string, amount: number): { product: Product; size: ProductSize } | null {
  const product = getProduct(slug);
  const size = product?.sizes.find((s) => s.amount === amount);
  return product && size ? { product, size } : null;
}

/** Drops unknown products or sizes and merges duplicates, so old or hand-edited data can't break a page. */
function sanitize(raw: unknown): OrderLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, OrderLine>();
  for (const item of raw) {
    const { slug, amount, qty } = (item ?? {}) as Partial<OrderLine>;
    if (typeof slug !== "string" || typeof amount !== "number" || typeof qty !== "number") continue;
    if (!Number.isInteger(qty) || qty < 1 || !findSize(slug, amount)) continue;
    const key = `${slug}.${amount}`;
    const total = (merged.get(key)?.qty ?? 0) + qty;
    merged.set(key, { slug, amount, qty: Math.min(total, MAX_QTY) });
  }
  return [...merged.values()];
}

/* ───────── Store ───────── */

let state: OrderLine[] | null = null;
const listeners = new Set<() => void>();

function read(): OrderLine[] {
  if (state === null) {
    try {
      state = sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      state = [];
    }
  }
  return state;
}

function write(next: OrderLine[]) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the list still works until the tab closes.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = null; // Another tab changed the list.
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOrderList(): OrderLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Sets the box count for one size. Zero removes the line. */
export function setQty(slug: string, amount: number, qty: number) {
  const clamped = Math.min(Math.max(0, Math.floor(qty)), MAX_QTY);
  const others = read().filter((l) => !(l.slug === slug && l.amount === amount));
  if (clamped === 0) {
    write(others);
    return;
  }
  const exists = others.length !== read().length;
  write(
    exists
      ? read().map((l) => (l.slug === slug && l.amount === amount ? { ...l, qty: clamped } : l))
      : [...others, { slug, amount, qty: clamped }],
  );
}

/** Adds (or with a negative number, removes) boxes, starting from what's stored now rather than what a component last rendered. */
export function addQty(slug: string, amount: number, delta: number) {
  const current = read().find((l) => l.slug === slug && l.amount === amount)?.qty ?? 0;
  setQty(slug, amount, current + delta);
}

export function clearList() {
  write([]);
}

export function mergeIntoList(lines: OrderLine[]) {
  write(sanitize([...read(), ...lines]));
}

/** Puts these lines on the list at exactly these quantities. Doing it twice changes nothing. */
export function applyLines(lines: OrderLine[]) {
  const incoming = sanitize(lines);
  const others = read().filter((l) => !incoming.some((i) => i.slug === l.slug && i.amount === l.amount));
  write([...others, ...incoming]);
}

/* ───────── Last order, so a shop can repeat it ───────── */

const LAST_ORDER_KEY = "musaffo-last-order-v1";
const lastOrderListeners = new Set<() => void>();

/** Only products and quantities: no name, phone or shop is copied into the order history. */
export type LastOrder = { orderNumber: string; placedAt: string; lines: OrderLine[] };

/** The shop's recent orders on this device, oldest first: what "your usual order" is learned from. */
const HISTORY_KEY = "musaffo-order-history-v1";
const MAX_HISTORY = 12;

export function rememberLastOrder(orderNumber: string, lines: OrderLine[]) {
  try {
    const stored = lines.map(({ slug, amount, qty }) => ({ slug, amount, qty }));
    const entry: LastOrder = { orderNumber, placedAt: new Date().toISOString(), lines: stored };
    window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(entry));
    const history = parseHistory(window.localStorage.getItem(HISTORY_KEY), null);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, entry].slice(-MAX_HISTORY)));
  } catch {
    // Without storage there's just nothing to repeat next time.
  }
  lastOrderListeners.forEach((listener) => listener());
}

function parseOrder(raw: unknown): LastOrder | null {
  const parsed = (raw ?? {}) as Partial<LastOrder>;
  // Products that left the catalog since the order drop out here.
  const lines = sanitize(parsed.lines);
  if (lines.length === 0 || typeof parsed.placedAt !== "string" || Number.isNaN(Date.parse(parsed.placedAt))) return null;
  return { orderNumber: String(parsed.orderNumber ?? ""), placedAt: parsed.placedAt, lines };
}

/** «Shop» for a shop, the person's name otherwise, from the details the order form saved on this device. */
export function customerLabel(raw: string | null): string {
  try {
    const c = JSON.parse(raw || "{}") as { customerType?: string; shop?: string; name?: string };
    return c.customerType === "shop" && c.shop?.trim() ? `«${c.shop.trim()}»` : c.name?.trim() || "";
  } catch {
    return "";
  }
}

/** History, or for shops that ordered before history was kept, their last order on its own. */
function parseHistory(historyRaw: string | null, lastRaw: string | null): LastOrder[] {
  try {
    const list = JSON.parse(historyRaw ?? "[]");
    const orders = (Array.isArray(list) ? list : []).map(parseOrder).filter((o): o is LastOrder => o !== null);
    if (orders.length > 0) return orders.slice(-MAX_HISTORY);
    const last = lastRaw ? parseOrder(JSON.parse(lastRaw)) : null;
    return last ? [last] : [];
  } catch {
    return [];
  }
}

function readHistoryRaw(): string {
  try {
    return `${window.localStorage.getItem(HISTORY_KEY) ?? ""}\u0000${window.localStorage.getItem(LAST_ORDER_KEY) ?? ""}`;
  } catch {
    return "\u0000";
  }
}

function subscribeLastOrder(listener: () => void) {
  lastOrderListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    lastOrderListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useOrderHistory(): LastOrder[] {
  const raw = useSyncExternalStore(subscribeLastOrder, readHistoryRaw, () => "\u0000");
  return useMemo(() => {
    const [history, last] = raw.split("\u0000");
    return parseHistory(history || null, last || null);
  }, [raw]);
}

function readLastOrderRaw(): string | null {
  try {
    return window.localStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

export function useLastOrder(): LastOrder | null {
  const raw = useSyncExternalStore(subscribeLastOrder, readLastOrderRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return parseOrder(JSON.parse(raw));
    } catch {
      return null;
    }
  }, [raw]);
}

/* ───────── Derived data ───────── */

export function resolveLine(line: OrderLine): ResolvedLine | null {
  const found = findSize(line.slug, line.amount);
  return found ? { ...line, ...found, pieces: line.qty * found.size.piecesPerBox } : null;
}

/** Lines in catalog order, so a list reads the same however it was built. */
export function resolveLines(lines: OrderLine[]): ResolvedLine[] {
  const position = (r: ResolvedLine) => products.indexOf(r.product) * 10 + r.product.sizes.indexOf(r.size);
  return lines
    .map(resolveLine)
    .filter((r): r is ResolvedLine => r !== null)
    .sort((a, b) => position(a) - position(b));
}

export function listTotals(resolved: ResolvedLine[]) {
  return {
    products: resolved.length,
    boxes: resolved.reduce((sum, r) => sum + r.qty, 0),
    pieces: resolved.reduce((sum, r) => sum + r.pieces, 0),
  };
}

/* ───────── Sharing ───────── */

export function encodeLines(lines: OrderLine[]): string {
  return lines.map((l) => `${l.slug}.${l.amount}.${l.qty}`).join("~");
}

export function decodeLines(encoded: string): OrderLine[] {
  const parsed = encoded.split("~").flatMap((part) => {
    const match = /^([a-z0-9-]+)\.(\d+)\.(\d+)$/.exec(part);
    return match ? [{ slug: match[1], amount: Number(match[2]), qty: Number(match[3]) }] : [];
  });
  return sanitize(parsed);
}

/**
 * Engil and Musaffo have products with identical names, so a line always names the
 * brand and fat. The fat is skipped when the product name already includes it.
 */
export function lineTitle(r: ResolvedLine, locale: Locale): string {
  const name = r.product.name[locale];
  const fat = formatFat(r.product.fatPercent, locale);
  return `${BRAND_NAMES[r.product.line]}: ${name}${name.includes(fat) ? "" : `, ${fat}`}`;
}

function summaryText(resolved: ResolvedLine[], locale: Locale): string {
  const dict = getDictionary(locale);
  const totals = listTotals(resolved);
  return `${dict.list.total}: ${plural(locale, totals.products, dict.list.products)}, ${plural(locale, totals.boxes, dict.list.boxes)}, ${plural(locale, totals.pieces, dict.list.pieces)}`;
}

export function listAsText(resolved: ResolvedLine[], locale: Locale): string {
  const dict = getDictionary(locale);
  const rows = resolved.map(
    (r, i) =>
      `${i + 1}. ${lineTitle(r, locale)}, ${formatSize(r.size, dict)}: ${plural(locale, r.qty, dict.list.boxes)} (${plural(locale, r.pieces, dict.list.pieces)})`,
  );
  return [dict.list.title, "", ...rows, "", summaryText(resolved, locale)].join("\n");
}

export function perBoxLabel(size: ProductSize, locale: Locale): string {
  return fill(getDictionary(locale).list.perBox, { count: size.piecesPerBox });
}
