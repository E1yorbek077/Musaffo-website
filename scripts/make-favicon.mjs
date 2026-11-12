// Builds public/favicon.ico (16, 32 and 48 px) from app/icon.svg, for browsers and tools that ask for /favicon.ico.
// Run after changing the icon: node scripts/make-favicon.mjs
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((size) => sharp(path.join(root, "app/icon.svg"), { density: 384 }).resize(size, size).png().toBuffer()),
);

// ICO: a 6-byte header, one 16-byte entry per image, then the PNG files themselves.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0); // width
  entry.writeUInt8(size, 1); // height
  entry.writeUInt8(0, 2); // no palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngs[i].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return entry;
});
const ico = Buffer.concat([header, ...entries, ...pngs]);
writeFileSync(path.join(root, "public/favicon.ico"), ico);
console.log(`public/favicon.ico: ${sizes.join(", ")} px, ${ico.length} bytes`);
