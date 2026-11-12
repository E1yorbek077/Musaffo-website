import { products } from "@/data/products";
import type { LastOrder, OrderLine } from "./order-list";

/**
 * "Your usual order", learned from the shop's recent orders on this device (lib/order-list.ts keeps the last 12).
 * A product belongs to it when it was in the latest order, or in at least two of them once there are three or more,
 * so a one-off doesn't stick around. Each comes with its typical quantity: the median of what was ordered.
 */
export type UsualItem = OrderLine & { times: number; lastQty: number };
export type Usual = { items: UsualItem[]; orders: number; lastAt: string };

const MAX_ITEMS = 16;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const catalogPosition = (slug: string, amount: number) => {
  const p = products.findIndex((x) => x.slug === slug);
  return p * 10 + (products[p]?.sizes.findIndex((s) => s.amount === amount) ?? 0);
};

export function usualOrder(history: LastOrder[]): Usual | null {
  if (history.length === 0) return null;
  const latest = history.at(-1)!;
  const seen = new Map<string, { slug: string; amount: number; qtys: number[] }>();
  for (const order of history) {
    for (const line of order.lines) {
      const key = `${line.slug}.${line.amount}`;
      const entry = seen.get(key) ?? { slug: line.slug, amount: line.amount, qtys: [] };
      entry.qtys.push(line.qty);
      seen.set(key, entry);
    }
  }
  const inLatest = new Set(latest.lines.map((l) => `${l.slug}.${l.amount}`));
  const items = [...seen.entries()]
    .filter(([key, e]) => inLatest.has(key) || (history.length >= 3 && e.qtys.length >= 2) || history.length < 3)
    .map(([, e]) => ({ slug: e.slug, amount: e.amount, qty: median(e.qtys), times: e.qtys.length, lastQty: e.qtys.at(-1)! }))
    // Most often ordered first, then in catalog order, so the sheet reads the same way every week.
    .sort((a, b) => b.times - a.times || catalogPosition(a.slug, a.amount) - catalogPosition(b.slug, b.amount))
    .slice(0, MAX_ITEMS);
  return items.length ? { items, orders: history.length, lastAt: latest.placedAt } : null;
}

/** Whole days between the last order and now, in the shop's own time. */
export function daysSince(iso: string, now = new Date()): number {
  const day = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
  return Math.max(0, day(now) - day(new Date(iso)));
}
