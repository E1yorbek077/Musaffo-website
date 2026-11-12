import { randomInt } from "node:crypto";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { getProduct } from "./catalog";
import { formatFat, formatSize, plural } from "./format";
import { mapUrl, parseGeoPoint, type GeoPoint } from "./geo";
import { formatPhone, parsePhone } from "./phone";
import type { BrandLine } from "@/data/products";

/** Server side of ordering: checks what the browser sent and builds the manager's Telegram message. */

export const MAX_ITEMS = 60;
export const MAX_BOXES = 999;
export const MAX_COMMENT = 500;
const MAX_FIELD = 200;
const TIME_ZONE = "Asia/Tashkent";

const BRAND_NAMES: Record<BrandLine, string> = { musaffo: "Musaffo", engil: "Engil", immun: "IMMUN+" };

export type OrderItem = {
  slug: string;
  brand: string;
  name: string;
  size: string;
  boxes: number;
  piecesPerBox: number;
  pieces: number;
  fat: string;
};

export type Order = {
  customerType: "shop" | "person";
  name: string;
  phone: string;
  shop: string;
  address: string;
  /** Shared by the customer with one tap; sent to the manager as a map pin. */
  location: GeoPoint | null;
  comment: string;
  locale: Locale;
  items: OrderItem[];
  totals: { products: number; boxes: number; pieces: number };
};

export type ValidationResult = { ok: true; order: Order } | { ok: false; fields: string[] };

/** Trims, and removes control characters that could break a log line or a message. */
const clean = (value: unknown, keepNewlines = false): string => {
  if (typeof value !== "string") return "";
  const stripped = keepNewlines ? value.replace(/\r\n?/g, "\n").replace(/[^\P{C}\n]/gu, "") : value.replace(/\p{C}+/gu, " ");
  return (keepNewlines ? stripped : stripped.replace(/\s+/g, " ")).trim();
};

/**
 * Checks everything the browser sent. Product names, sizes and pieces per box are taken from
 * data/products.ts: only the slug, size and box count come from the client.
 */
export function validateOrder(body: unknown): ValidationResult {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const fields: string[] = [];

  const customerType = input.customerType;
  if (customerType !== "shop" && customerType !== "person") fields.push("customerType");

  const name = clean(input.name);
  if (!name || name.length > MAX_FIELD) fields.push("name");

  const phone = typeof input.phone === "string" ? parsePhone(input.phone) : null;
  if (!phone) fields.push("phone");

  const shop = customerType === "shop" ? clean(input.shop) : "";
  if ((customerType === "shop" && !shop) || shop.length > MAX_FIELD) fields.push("shop");

  const address = clean(input.address);
  if (!address || address.length > MAX_FIELD) fields.push("address");

  const location = parseGeoPoint(input.location);
  if (location === "invalid") fields.push("location");

  const comment = clean(input.comment, true);
  if (comment.length > MAX_COMMENT) fields.push("comment");

  const locale = typeof input.locale === "string" && isLocale(input.locale) ? input.locale : null;
  if (!locale) fields.push("locale");

  const uz = getDictionary("uz");
  const items: OrderItem[] = [];
  const rawItems = input.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
    fields.push("items");
  } else {
    const seen = new Set<string>();
    for (const raw of rawItems as Record<string, unknown>[]) {
      const product = typeof raw?.slug === "string" ? getProduct(raw.slug) : undefined;
      const size = product?.sizes.find((s) => s.amount === raw?.size);
      const boxes = raw?.boxes;
      const key = `${raw?.slug}.${raw?.size}`;
      if (!product || !size || !Number.isInteger(boxes) || (boxes as number) < 1 || (boxes as number) > MAX_BOXES || seen.has(key)) {
        fields.push("items");
        break;
      }
      seen.add(key);
      items.push({
        slug: product.slug,
        brand: BRAND_NAMES[product.line],
        name: product.name.uz,
        size: formatSize(size, uz),
        boxes: boxes as number,
        piecesPerBox: size.piecesPerBox,
        pieces: (boxes as number) * size.piecesPerBox,
        fat: formatFat(product.fatPercent, "uz"),
      });
    }
  }

  if (fields.length > 0) return { ok: false, fields: [...new Set(fields)] };
  return {
    ok: true,
    order: {
      customerType: customerType as Order["customerType"],
      name,
      phone: phone as string,
      shop,
      address,
      location: location as GeoPoint | null,
      comment,
      locale: locale as Locale,
      items,
      totals: {
        products: items.length,
        boxes: items.reduce((sum, item) => sum + item.boxes, 0),
        pieces: items.reduce((sum, item) => sum + item.pieces, 0),
      },
    },
  };
}

function tashkentParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** "M-261107-4821": the date in Tashkent plus a random number. */
export function createOrderNumber(date = new Date()): string {
  const { year, month, day } = tashkentParts(date);
  return `M-${year.slice(2)}${month}${day}-${randomInt(1000, 10000)}`;
}

export const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Telegram allows 4096 characters per message. Staying well under leaves room for what follows. */
const MAX_MESSAGE = 3800;

/** The manager's message, always in Uzbek. A very long order is split into several messages between lines. */
export function buildTelegramMessages(order: Order, orderNumber: string, date = new Date()): string[] {
  const uz = getDictionary("uz");
  const { year, month, day, hour, minute } = tashkentParts(date);
  const who =
    order.customerType === "shop"
      ? `Do‘kon «${escapeHtml(order.shop)}» — ${escapeHtml(order.name)}`
      : `Shaxsiy — ${escapeHtml(order.name)}`;

  const head = [
    `🆕 <b>Yangi buyurtma #${orderNumber}</b>`,
    `👤 Mijoz: ${who}`,
    `📞 ${formatPhone(order.phone)}`,
    `📍 ${escapeHtml(order.address)}`,
    // The pin itself follows as a separate Telegram location message, replying to this one.
    ...(order.location ? [`🗺 <a href="${escapeHtml(mapUrl(order.location))}">Xaritada ochish</a> · ±${order.location.accuracy} m`] : []),
    ...(order.comment ? [`💬 Izoh: ${escapeHtml(order.comment)}`] : []),
    "",
  ];
  const rows = order.items.map(
    (item, i) =>
      `${i + 1}. ${item.brand} · ${escapeHtml(item.name)} · ${item.size} — ${plural("uz", item.boxes, uz.list.boxes)} (${plural("uz", item.pieces, uz.list.pieces)})`,
  );
  const foot = [
    "",
    `<b>Jami: ${plural("uz", order.totals.products, uz.list.products)} · ${plural("uz", order.totals.boxes, uz.list.boxes)} · ${plural("uz", order.totals.pieces, uz.list.pieces)}</b>`,
    `🌐 Til: ${order.locale} · 🕒 ${day}.${month}.${year} ${hour}:${minute} (${TIME_ZONE})`,
  ];

  const messages: string[] = [];
  let current: string[] = [];
  let length = 0;
  for (const line of [...head, ...rows, ...foot]) {
    if (current.length > 0 && length + line.length + 1 > MAX_MESSAGE) {
      messages.push(current.join("\n"));
      current = [`(davomi) #${orderNumber}`];
      length = current[0].length;
    }
    current.push(line);
    length += line.length + 1;
  }
  messages.push(current.join("\n"));
  return messages;
}

/* ───────── Rate limit ───────── */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

/** In-memory, so it resets on restart and is per process. Fine for one PM2 process. */
export function isRateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keeps the map from growing for ever.
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  }
  return false;
}

/** Nginx sets X-Real-IP (see DEPLOY.md), overwriting anything the visitor sent. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}
