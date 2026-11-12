import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n";
import { getProduct } from "./catalog";

/**
 * Shelf price labels a shop prints for its own fridge. The prices are the shop's own retail prices,
 * typed by the shop and kept only in this browser, so next week's labels are one tap away.
 */
export type LabelSize = "large" | "small";
export type LabelsState = {
  /** "slug.amount" for each label, in the order chosen. */
  items: string[];
  /** Shop's price per piece, in so‘m, by "slug.amount". Kept when a label is removed, for next time. */
  prices: Record<string, number>;
  size: LabelSize;
  /** Language printed on the labels; null follows the page. */
  language: Locale | null;
  /** A QR code on each label that puts a box of that product on the order list when scanned. */
  qr: boolean;
};

/** Labels per A4 sheet: large 2 × 4 (97 × 70 mm), small 3 × 8 (64.6 × 35 mm). */
export const LAYOUTS: Record<LabelSize, { columns: number; rows: number }> = {
  large: { columns: 2, rows: 4 },
  small: { columns: 3, rows: 8 },
};

export const MAX_PRICE = 99_999_999;
const MAX_ITEMS = 240;
const STORAGE_KEY = "musaffo-labels-v1";
const EMPTY: LabelsState = { items: [], prices: {}, size: "large", language: null, qr: true };

export const labelKey = (slug: string, amount: number) => `${slug}.${amount}`;

export function parseKey(key: string) {
  const dot = key.lastIndexOf(".");
  const product = getProduct(key.slice(0, dot));
  const size = product?.sizes.find((s) => String(s.amount) === key.slice(dot + 1));
  return product && size ? { product, size } : null;
}

/** Drops unknown products and odd values, so old or hand-edited data can't break the page. */
function sanitize(raw: unknown): LabelsState {
  const r = (raw ?? {}) as Partial<LabelsState>;
  const items = Array.isArray(r.items) ? [...new Set(r.items.filter((k) => typeof k === "string" && parseKey(k)))].slice(0, MAX_ITEMS) : [];
  const prices: Record<string, number> = {};
  for (const [k, v] of Object.entries(r.prices ?? {})) if (parseKey(k) && Number.isInteger(v) && v > 0 && v <= MAX_PRICE) prices[k] = v;
  return {
    items,
    prices,
    size: r.size === "small" ? "small" : "large",
    qr: r.qr !== false,
    language: r.language === "uz" || r.language === "ru" || r.language === "en" ? r.language : null,
  };
}

let state: LabelsState | null = null;
const listeners = new Set<() => void>();

function read(): LabelsState {
  if (state === null) {
    try {
      state = sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"));
    } catch {
      state = EMPTY;
    }
  }
  return state;
}

function write(next: LabelsState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: labels still work until the tab closes.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    state = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLabels(): LabelsState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Adds labels that aren't there yet, keeping the order. */
export function addLabels(keys: string[]) {
  const s = read();
  write(sanitize({ ...s, items: [...s.items, ...keys.filter((k) => !s.items.includes(k))] }));
}

export function removeLabel(key: string) {
  const s = read();
  write({ ...s, items: s.items.filter((k) => k !== key) });
}

export function clearLabels() {
  write({ ...read(), items: [] });
}

export function setPrice(key: string, price: number | null) {
  const s = read();
  const prices = { ...s.prices };
  if (price && price > 0) prices[key] = Math.min(Math.floor(price), MAX_PRICE);
  else delete prices[key];
  write({ ...s, prices });
}

export function setLabelOptions(change: Partial<Pick<LabelsState, "size" | "language" | "qr">>) {
  write({ ...read(), ...change });
}

/** 12500 → "12 500", with a no-break space so the price never wraps. */
export const formatPrice = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
