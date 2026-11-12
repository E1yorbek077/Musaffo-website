import { lineLabels } from "@/components/LineBadge";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSize, plural, webpPath } from "./format";
import { listTotals, perBoxLabel, resolveLines, type LastOrder, type ResolvedLine } from "./order-list";
import { SALES_PHONE } from "./phone";

/** "12.11.2026, 14:05" in the visitor's own clock. Written out by hand: Intl's Uzbek support varies between browsers. */
export function formatPlacedAt(iso: string): string {
  const d = new Date(iso);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export function receiptLines(order: LastOrder) {
  const lines = resolveLines(order.lines);
  return { lines, totals: listTotals(lines) };
}

/* ───────── The receipt as a picture, to keep or forward (Telegram, gallery) ───────── */

const W = 1080;
const PAD = 72; // around the paper
const IN = 56; // inside the paper
const ROW = 132;
const INK = "#0a2f57";
const SLATE = "#4a6580";
const BRAND = "#005aaa";
const LEAF = "#157347";
const FIELD = "#e3f3fd";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Cuts text to fit a width, adding an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Up to two lines of wrapped text. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(" ");
  const first: string[] = [];
  while (words.length && ctx.measureText([...first, words[0]].join(" ")).width <= width) first.push(words.shift()!);
  if (first.length === 0) return [fit(ctx, text, width)];
  return words.length ? [first.join(" "), fit(ctx, words.join(" "), width)] : [first.join(" ")];
}

/** Paper with a scalloped top and bottom edge, like a till receipt. */
function paper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = 9;
  const step = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let cx = x + step / 2; cx < x + w; cx += step) ctx.arc(cx, y, r, Math.PI, 0, true);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  for (let cx = x + w - step / 2; cx > x; cx -= step) ctx.arc(cx, y + h, r, 0, Math.PI, true);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

export async function drawReceipt(order: LastOrder, locale: Locale, customer = ""): Promise<Blob> {
  const dict = getDictionary(locale);
  const t = dict.receipt;
  const { lines, totals } = receiptLines(order);
  await document.fonts?.ready;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font = (weight: number, size: number) => `${weight} ${size}px ${family}`;

  const headerH = 300;
  const metaH = customer ? 64 : 0;
  const footerH = 270;
  // Names are wrapped first, so a two-line name gets a taller row instead of crowding the next one.
  const nameWidth = W - PAD * 2 - IN * 2 - 120 - 210;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font(800, 30);
  const names = lines.map((l) => wrap(measure, l.product.name[locale], nameWidth));
  const rowH = names.map((n) => ROW + (n.length - 1) * 34);
  const paperH = headerH + metaH + 40 + rowH.reduce((a, b) => a + b, 0) + footerH;
  const H = paperH + PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, W, H);

  const x = PAD;
  const w = W - PAD * 2;
  const right = x + w - IN;
  let y = PAD;

  ctx.save();
  ctx.shadowColor = "rgba(10,47,87,0.22)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#fff";
  paper(ctx, x, y, w, paperH);
  ctx.fill();
  ctx.restore();

  // Brand band with the logo and the order number.
  ctx.save();
  paper(ctx, x, y, w, paperH);
  ctx.clip();
  ctx.fillStyle = BRAND;
  ctx.fillRect(x, y, w, 128);
  ctx.restore();
  const [logo, ...packs] = await Promise.all([loadImage("/brand/logo.svg"), ...lines.map((l) => loadImage(webpPath(l.size.image, "shelf")))]);
  if (logo) ctx.drawImage(logo, x + IN, y + 34, 220, 68);
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.font = font(800, 28);
  ctx.fillText(t.title, right, y + 78);

  y += 128;
  ctx.textAlign = "left";
  ctx.fillStyle = SLATE;
  ctx.font = font(700, 28);
  ctx.fillText(dict.order.numberLabel, x + IN, y + 62);
  ctx.fillStyle = INK;
  ctx.font = font(900, 56);
  ctx.fillText(order.orderNumber || "—", x + IN, y + 128);
  ctx.textAlign = "right";
  ctx.fillStyle = SLATE;
  ctx.font = font(700, 28);
  ctx.fillText(formatPlacedAt(order.placedAt), right, y + 62);
  ctx.fillStyle = LEAF;
  ctx.font = font(900, 28);
  ctx.fillText(`✓ ${t.sent}`, right, y + 124);
  y += headerH - 128;

  if (customer) {
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = font(800, 32);
    ctx.fillText(fit(ctx, `${t.customer}: ${customer}`, w - IN * 2), x + IN, y + 20);
    y += metaH;
  }

  const dash = (at: number) => {
    ctx.save();
    ctx.strokeStyle = "#b9cfe0";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(x + IN, at);
    ctx.lineTo(right, at);
    ctx.stroke();
    ctx.restore();
  };
  dash(y);
  y += 40;

  let top = y;
  lines.forEach((line: ResolvedLine, i) => {
    const pack = packs[i];
    if (pack) {
      const s = Math.min(96 / pack.width, 96 / pack.height);
      ctx.drawImage(pack, x + IN + (96 - pack.width * s) / 2, top + (96 - pack.height * s) / 2, pack.width * s, pack.height * s);
    }
    const textX = x + IN + 120;
    const qtyW = 210;
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    ctx.font = font(800, 30);
    const name = names[i];
    name.forEach((part, n) => ctx.fillText(part, textX, top + 34 + n * 34));
    ctx.fillStyle = SLATE;
    ctx.font = font(700, 24);
    const sub = `${lineBrand(line)} · ${formatFat(line.product.fatPercent, locale)} · ${formatSize(line.size, dict)} · ${perBoxLabel(line.size, locale)}`;
    ctx.fillText(fit(ctx, sub, right - qtyW - textX), textX, top + 40 + name.length * 34);
    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = font(900, 34);
    ctx.fillText(plural(locale, line.qty, dict.list.boxes), right, top + 42);
    ctx.fillStyle = BRAND;
    ctx.font = font(800, 26);
    ctx.fillText(plural(locale, line.pieces, dict.list.pieces), right, top + 80);
    top += rowH[i];
  });
  y = top;

  dash(y);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = font(900, 36);
  ctx.fillText(dict.list.total, x + IN, y + 68);
  ctx.textAlign = "right";
  ctx.fillText(
    `${plural(locale, totals.products, dict.list.products)} · ${plural(locale, totals.boxes, dict.list.boxes)} · ${plural(locale, totals.pieces, dict.list.pieces)}`,
    right,
    y + 68,
  );
  ctx.textAlign = "center";
  ctx.fillStyle = SLATE;
  ctx.font = font(700, 26);
  ctx.fillText(fit(ctx, t.next, w - IN * 2), x + w / 2, y + 150);
  ctx.fillStyle = BRAND;
  ctx.font = font(900, 30);
  ctx.fillText(fill(t.questions, { phone: SALES_PHONE.display }), x + w / 2, y + 200);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

const lineBrand = (line: ResolvedLine) => lineLabels[line.product.line];

/**
 * Opens the phone's share sheet with the picture (so it can go to Telegram or the gallery);
 * where sharing files isn't supported, downloads it instead. Returns what happened.
 */
export async function saveReceiptImage(order: LastOrder, locale: Locale, customer = ""): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await drawReceipt(order, locale, customer);
  const name = `musaffo-${order.orderNumber || "order"}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${getDictionary(locale).receipt.title} ${order.orderNumber}` });
      return "shared";
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return "cancelled";
      // Some browsers claim support and then refuse: fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
