// Creates WebP versions next to every PNG in public/products:
//   {slug}.stage.webp  max 900px, the large pack on the product page and in the quick view
//   {slug}.thumb.webp  max 480px, catalog cards and search results
//   {slug}.shelf.webp  max 320px, the home page fridge, quick order and the order list
// Files that are already up to date are skipped, so replacing a PNG is enough.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "public", "products");
const pngs = fs.readdirSync(root, { recursive: true }).filter((f) => f.endsWith(".png"));
const variants = [
  { suffix: ".stage", max: 900, quality: 82 },
  { suffix: ".thumb", max: 480, quality: 80 },
  { suffix: ".shelf", max: 320, quality: 76 },
];

const isFresh = (target, source) =>
  fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(source).mtimeMs;

let written = 0;
for (const rel of pngs) {
  const src = path.join(root, rel);
  const base = src.slice(0, -".png".length);
  for (const { suffix, max, quality } of variants) {
    const target = `${base}${suffix}.webp`;
    if (isFresh(target, src)) continue;
    await sharp(src)
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
      .webp({ quality, alphaQuality: 90 })
      .toFile(target);
    written++;
  }
}
console.log(`images: ${pngs.length} source PNGs, ${written} WebP files written`);
