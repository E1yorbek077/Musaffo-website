import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { BrandLine, Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatSizes } from "./format";
import { TINTS } from "./tints";

/**
 * Share cards: the picture Telegram, WhatsApp and others show when someone shares a link.
 * The share.png routes render them at build time; lib/share.ts says which page uses which.
 * Fonts are static Nunito instances (assets/fonts, SIL OFL), because the renderer can't read
 * the site's WOFF2 or variable fonts.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const root = process.cwd();
const FONTS = [
  { name: "Nunito", data: readFileSync(path.join(root, "assets/fonts/nunito-800.woff")), weight: 800 as const, style: "normal" as const },
  { name: "Nunito", data: readFileSync(path.join(root, "assets/fonts/nunito-900.woff")), weight: 900 as const, style: "normal" as const },
];
const LOGO = `data:image/svg+xml;base64,${readFileSync(path.join(root, "public/brand/logo.svg")).toString("base64")}`;

type Pack = { src: string; width: number; height: number };
const packCache = new Map<string, Pack>();

/** A packshot as a data URI, with its size read from the PNG header. */
function pack(publicPath: string): Pack {
  const cached = packCache.get(publicPath);
  if (cached) return cached;
  const data = readFileSync(path.join(root, "public", publicPath));
  const result = { src: `data:image/png;base64,${data.toString("base64")}`, width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  packCache.set(publicPath, result);
  return result;
}

/** Fits a pack inside a box, keeping its shape. */
const fit = (p: Pack, maxW: number, maxH: number) => {
  const scale = Math.min(maxW / p.width, maxH / p.height);
  return { width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
};

const LINE_COLORS: Record<BrandLine, { text: string; label: string }> = {
  musaffo: { text: "#005aaa", label: "Musaffo" },
  engil: { text: "#c8313f", label: "Engil" },
  immun: { text: "#9a4900", label: "IMMUN+" },
};

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const render = (element: React.ReactElement) => new ImageResponse(element, { ...OG_SIZE, fonts: FONTS });

/** The logo and the branch's name ("Musaffo Xorazm"): this site is the Khorezm branch, not musaffo.uz. */
function Footer({ color, site }: { color: string; site: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <img src={LOGO} width={190} height={59} alt="" />
      <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color }}>{site}</div>
    </div>
  );
}

function Chip({ children, ink }: { children: string; ink: string }) {
  return (
    <div style={{ display: "flex", background: "#ffffff", color: ink, borderRadius: 999, padding: "10px 22px", fontSize: 30, fontWeight: 900 }}>
      {children}
    </div>
  );
}

/** Long names get smaller type, so even the butter's full Russian name fits in three lines. */
const nameSize = (name: string) => (name.length <= 22 ? 70 : name.length <= 36 ? 60 : name.length <= 52 ? 52 : 44);
/** The background word is sized from its longest line so it always fits its 520px column. */
const WORD_WIDTH = 520;
const wordLines = (word: string) => word.split(" ").filter(Boolean);
const wordSize = (word: string) => {
  const lines = wordLines(word);
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.floor(Math.min(180, WORD_WIDTH / (longest * 0.72), 520 / (lines.length * 1.0)));
};

/* ───────── Product ───────── */

export function productCard(product: Product, locale: Locale) {
  const dict = getDictionary(locale);
  const tint = TINTS[product.tint];
  const line = LINE_COLORS[product.line];
  const name = product.name[locale];
  const word = (product.short?.[locale] ?? product.flavour?.[locale] ?? "").toUpperCase();
  const perBox = fill(dict.list.perBox, { count: product.sizes.map((s) => s.piecesPerBox).join(" / ") });

  // Two sizes stand side by side, the smaller one visibly shorter, as on the product page.
  const packs = product.sizes.map((size, i) => {
    const p = pack(size.image);
    const box = product.sizes.length > 1 ? { w: 230, h: i === 0 ? 400 : 520 } : { w: 470, h: 520 };
    return { ...p, ...fit(p, box.w, box.h) };
  });

  return render(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: tint.soft,
        backgroundImage: `radial-gradient(circle at 76% 50%, ${tint.mid} 0%, ${tint.soft} 58%)`,
        fontFamily: "Nunito",
      }}
    >
      {word && (
        <div
          style={{
            // Starts right of the 640px text column, so it never sits behind the name.
            position: "absolute",
            right: 20,
            top: 0,
            bottom: 0,
            width: WORD_WIDTH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: wordSize(word),
            lineHeight: 0.95,
            fontWeight: 900,
            color: alpha(tint.ink, 0.13),
          }}
        >
          {wordLines(word).map((line) => (
            <div key={line} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: "56px 0 50px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", background: "#ffffff", color: line.text, borderRadius: 999, padding: "6px 20px", fontSize: 26, fontWeight: 900 }}>
              {line.label}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: nameSize(name), lineHeight: 1.08, fontWeight: 900, color: tint.ink }}>{name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Chip ink={tint.ink}>{formatFat(product.fatPercent, locale)}</Chip>
            <Chip ink={tint.ink}>{formatSizes(product, dict)}</Chip>
            <Chip ink={tint.ink}>{perBox}</Chip>
          </div>
        </div>
        <Footer color={tint.ink} site={getDictionary(locale).meta.siteName} />
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "center", gap: 26, paddingBottom: 55 }}>
        {packs.map((p, i) => (
          <img key={i} src={p.src} width={p.width} height={p.height} alt="" />
        ))}
      </div>
    </div>,
  );
}

/* ───────── Category and brand ───────── */

const BLUE = "linear-gradient(105deg, #0190d2 0%, #0077be 38%, #005aa9 72%)";

/** Packs standing on a white shelf, like the fridge on the home page. */
function Shelf({ images, height }: { images: string[]; height: number }) {
  const each = Math.floor(560 / images.length) - 14;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 14,
        width: 600,
        padding: "34px 20px 26px",
        borderRadius: 36,
        background: "linear-gradient(180deg, #ffffff 0%, #e4f1fa 100%)",
        borderBottom: "10px solid #9fd4f5",
      }}
    >
      {images.map((image) => {
        const p = pack(image);
        const size = fit(p, each, height);
        return <img key={image} src={p.src} width={size.width} height={size.height} alt="" />;
      })}
    </div>
  );
}

export function shelfCard({ eyebrow, title, subtitle, images, site }: { eyebrow?: string; title: string; subtitle: string; images: string[]; site: string }) {
  return render(
    // The solid colour under the gradient keeps the edges fully opaque.
    <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#0077be", backgroundImage: BLUE, fontFamily: "Nunito", color: "#ffffff" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560, padding: "60px 0 54px 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {eyebrow && <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>{eyebrow}</div>}
          <div style={{ display: "flex", fontSize: title.length > 18 ? 64 : 76, lineHeight: 1.05, fontWeight: 900 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", background: "#ffffff", borderRadius: 999, padding: "10px 22px" }}>
            <img src={LOGO} width={180} height={56} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>{site}</div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 24 }}>
        <Shelf images={images} height={360} />
      </div>
    </div>,
  );
}
