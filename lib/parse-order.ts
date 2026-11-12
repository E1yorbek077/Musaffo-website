import { products, type Product } from "@/data/products";
import { fold, searchProducts } from "@/lib/search";

/**
 * Turns an order written the way people write it in a chat into order lines:
 *
 *   Assalomu alaykum!
 *   Kefir 1% 900 — 5 karobka
 *   qatiq 10
 *   сырок какао 120 шт
 *
 * Each line (or each "… N karobka" stretch of a dictated sentence) is read for a quantity, a size and
 * a fat, and the rest goes to the same product search as the rest of the site (lib/search.ts), so
 * Cyrillic, typos and word endings work here too. Nothing is guessed silently: when the words fit
 * several products or the size isn't named, the line asks the visitor to choose.
 */

export type ParsedLine = {
  /** The line as written. */
  text: string;
  /** Products that fit equally well, catalog order. Empty when nothing fits. */
  candidates: Product[];
  /** Per candidate slug, the sizes the text named ("900", "1 l", "0,9 kg"); missing when no size was named. */
  sizes: Record<string, number[]>;
  /** Words that had to be left out to find a match (not filler like "iltimos"): the match needs confirming. */
  ignored: string[];
  /** Boxes, when written as boxes or as a bare number. */
  boxes: number | null;
  /** Pieces, when written as pieces ("120 dona", "120 шт"): turned into boxes once the size is known. */
  pieces: number | null;
  /** A line with no product and no numbers: a greeting, a thank-you, a signature. */
  chatter: boolean;
};

const MAX_QTY = 999;

/* ───────── Words for boxes and pieces ───────── */

// Stems, so endings don't matter: karobka, karopka, korobki, коробок, коробки, кор., quti, qutі, ящика, упаковки, box, boxes.
const BOX = String.raw`(?:karob|karop|korob|kor|quti|кути|қути|blok|блок|короб|каробк|кор|ящ|упак|уп|box|bx)\p{L}*\.?`;
const PIECE = String.raw`(?:dona|дона|шт|штук|pcs|pc|piece|pieces)\p{L}*\.?`;
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const END = String.raw`(?![\p{L}\d])`;

const BOX_QTY = new RegExp(String.raw`(?<![\d.,])(\d{1,4})\s*${BOX}${END}`, "giu");
const PIECE_QTY = new RegExp(String.raw`(?<![\d.,])(\d{1,5})\s*${PIECE}${END}`, "giu");
// "x5", "× 5", "*5", "kefir — 5", "kefir: 5", "kefir = 5"
const MARKED_QTY = new RegExp(String.raw`(?:^|\s|(?<=\p{L}))(?:[xх×*]|[-—–:=]+)\s*(\d{1,3})(?:\s*ta)?\s*$`, "iu");
const TIMES_QTY = new RegExp(String.raw`(?<=\d\s*\p{L}*)\s*[xх×*]\s*(\d{1,3})${END}`, "iu");

// 900 g, 900гр, 0,9 kg, 1 l, 1л, 1 litr, 1000 ml
const SIZE = new RegExp(String.raw`(?<![\d.,])${NUM}\s*(kg|кг|kilo\p{L}*|кило\p{L}*|gr|g|гр|г|gramm\p{L}*|грамм\p{L}*|ml|мл|lt|l|л|litr\p{L}*|литр\p{L}*)${END}`, "giu");

const parseNumber = (text: string) => Number(text.replace(",", "."));

/** "0,9 kg" → "900g", "1000 ml" → "1l": the way sizes are spelled in the search index. */
function sizeToken(value: number, unit: string): string | null {
  const u = unit.toLowerCase();
  if (/^(kg|кг|kilo|кило)/.test(u)) return `${Math.round(value * 1000)}g`;
  if (/^(ml|мл)/.test(u)) return `${Math.round(value) / 1000}l`;
  if (/^(l|л|lt|litr|литр)/.test(u)) return `${value}l`;
  return `${Math.round(value)}g`;
}

/** Every pack size in the catalog: a bare "900" is much more likely a size than 900 boxes. */
const SIZE_AMOUNTS = new Set(products.flatMap((p) => p.sizes.map((s) => s.amount)));

/* ───────── Splitting the text into lines ───────── */

const SPLIT_AFTER_QTY = new RegExp(String.raw`(?<=\d\s*(?:${BOX}|${PIECE}))${END}`, "iu");
const SPLIT_BEFORE_QTY = new RegExp(String.raw`(?<![\d.,])(?=\d{1,5}\s*(?:${BOX}|${PIECE})${END})`, "iu");

const clean = (parts: string[]) =>
  parts
    .map((line) => line.replace(/^\s*(?:\d{1,2}[.)]\s+|[-–—*·]\s+)/, "").trim()) // list numbering: "1. kefir", "- kefir"
    .filter((line) => line.length > 0);

function splitLines(text: string): string[] {
  return clean(text.split(/\r?\n|;|(?<!\d),|,(?!\d)|•/)).flatMap((line) => {
    // A dictated sentence has no line breaks: "kefir 900 5 karobka qatiq 10 karobka". Split after each quantity,
    // or before each one when the sentence puts quantities first: "5 коробок кефира 3 коробки катыка".
    const after = clean(line.split(SPLIT_AFTER_QTY));
    if (after.length < 2) return after;
    return parseLine(after[0]).candidates.length > 0 ? after : clean(line.split(SPLIT_BEFORE_QTY));
  });
}

/* ───────── Search with forgiveness for extra words ───────── */

/**
 * Words people add around an order that say nothing about the product, folded (lib/search.ts fold):
 * please, need, give, tomorrow, today, also, more, order… They're skipped without a second thought.
 */
const FILLER = new Set(
  (
    "iltimos kerak kere kerek bering beringlar bersangiz yuboring menga bizga ham yana ertaga bugun buyurtma zakaz " +
    "mahsulot tovar dan uchun nujno nado dayte pojaluysta pojalusta pls please need want also more today tomorrow " +
    "order zavtra segodnya toje esho eshyo eshe mne nam pokazhite prishlite privezite"
  ).split(" "),
);

type Match = { candidates: Product[]; sizes: Record<string, number[]>; ignored: string[] };

/**
 * The products the words fit best, ties included, and the sizes named. Filler words are skipped. Any other word that
 * had to be left out ("sour" in "sour cream", a size that doesn't exist) is reported, so the line asks to be confirmed.
 */
function bestMatch(query: string): Match | null {
  const words = fold(query).split(" ").filter(Boolean);
  const useful = words.filter((w) => searchProducts(w).length > 0);
  if (!useful.some((w) => !/\d/.test(w)) && !useful.some((w) => /\d%$/.test(w))) return null; // needs at least one real word or a fat
  // Several words can each fit something but not together ("banan kefir"): drop words from the end until something fits.
  for (let n = useful.length; n > 0; n--) {
    const used = useful.slice(0, n);
    const hits = searchProducts(used.join(" "));
    if (hits.length === 0) continue;
    const top = hits[0].score;
    const tied = hits.filter((h) => h.score >= top - 1e-6);
    const sizes: Record<string, number[]> = {};
    for (const h of tied) if (h.sizes) sizes[h.product.slug] = h.sizes;
    const ignored = words.filter((w) => !used.includes(w) && !FILLER.has(w) && w.length > 1);
    return { candidates: tied.map((h) => h.product), sizes, ignored };
  }
  return null;
}

/* ───────── One line ───────── */

function parseLine(text: string): ParsedLine {
  let rest = ` ${text} `;
  let boxes: number | null = null;
  let pieces: number | null = null;

  const take = (re: RegExp, set: (n: number) => void) => {
    re.lastIndex = 0;
    const match = re.exec(rest);
    if (!match) return false;
    set(Number(match[1]));
    rest = rest.slice(0, match.index) + " " + rest.slice(match.index + match[0].length);
    return true;
  };

  // Explicit units first: "5 karobka", "120 dona", then "x5" / "— 5" at the end.
  const found =
    take(BOX_QTY, (n) => (boxes = n)) ||
    take(PIECE_QTY, (n) => (pieces = n)) ||
    take(TIMES_QTY, (n) => (boxes = n));
  if (!found) take(MARKED_QTY, (n) => (boxes = n));

  rest = rest.replace(SIZE, (_, value: string, unit: string) => ` ${sizeToken(parseNumber(value), unit) ?? ""} `);
  rest = rest.replace(/(?<![\p{L}])ta(?![\p{L}])/giu, " "); // "5 ta": a counter word with no meaning of its own

  let match = boxes === null && pieces === null ? null : bestMatch(rest);

  if (boxes === null && pieces === null) {
    // A bare number is the quantity unless it reads as a size or a fat: try the likeliest reading first.
    const bare = [...rest.matchAll(/(?<![\d.,])(\d{1,3})(?![\d.,%\p{L}])/gu)];
    const tries = [
      ...bare.filter((m) => !SIZE_AMOUNTS.has(Number(m[1])) || Number(m[1]) < 40).reverse(),
      null,
      ...bare.filter((m) => SIZE_AMOUNTS.has(Number(m[1])) && Number(m[1]) >= 40).reverse(),
    ];
    // A reading that uses every word beats one that has to leave words out.
    let fallback: { found: Match; choice: (typeof tries)[number] } | null = null;
    for (const choice of tries) {
      const query = choice ? rest.slice(0, choice.index) + " " + rest.slice(choice.index! + choice[0].length) : rest;
      const found = bestMatch(query);
      if (!found) continue;
      if (found.ignored.length > 0) {
        fallback ??= { found, choice };
        continue;
      }
      fallback = { found, choice };
      break;
    }
    if (fallback) {
      match = fallback.found;
      if (fallback.choice) boxes = Number(fallback.choice[1]);
    }
  }

  const clamp = (n: number | null) => (n === null ? null : Math.min(Math.max(n, 1), MAX_QTY));
  return {
    text,
    candidates: match?.candidates ?? [],
    sizes: match?.sizes ?? {},
    ignored: match?.ignored ?? [],
    boxes: clamp(boxes),
    pieces: pieces === null ? null : Math.max(pieces, 1),
    chatter: !match && !/\d/.test(text),
  };
}

export function parseOrderText(text: string): ParsedLine[] {
  return splitLines(text.slice(0, 5000)).slice(0, 60).map(parseLine);
}

/** Boxes for a line once its size is known: pieces are rounded up to whole boxes. */
export function boxesFor(line: Pick<ParsedLine, "boxes" | "pieces">, piecesPerBox: number): number | null {
  if (line.boxes !== null) return line.boxes;
  if (line.pieces !== null) return Math.min(Math.ceil(line.pieces / piecesPerBox), MAX_QTY);
  return null;
}
