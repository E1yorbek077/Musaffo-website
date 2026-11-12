import qrcode from "qrcode-generator";

/**
 * A QR code as one SVG path, so it prints sharp at any label size. Error correction "M" (15 %) survives a
 * label that's a little scuffed or bent around a fridge shelf. The quiet zone is left to the layout.
 */
export function qrPath(text: string): { size: number; path: string } {
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const size = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < size; row++) {
    // Runs of dark modules become one rectangle each: about a fifth of the path a square per module would need.
    for (let col = 0; col < size; col++) {
      if (!qr.isDark(row, col)) continue;
      let end = col;
      while (end + 1 < size && qr.isDark(row, end + 1)) end++;
      path += `M${col} ${row}h${end - col + 1}v1h-${end - col + 1}z`;
      col = end;
    }
  }
  return { size, path };
}

/**
 * What a label's code opens: the scan page, which puts one box of that product on the order list. One page per
 * language with the product in the query, so the offline app can keep it (pages are cached by path) and a scan
 * works with no signal at the back of the shop.
 */
export const scanUrl = (origin: string, locale: string, slug: string, amount: number) => `${origin}/${locale}/r/?p=${slug}.${amount}`;
