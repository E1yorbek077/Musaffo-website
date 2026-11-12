# Musaffo product showcase

Static Next.js site (App Router, TypeScript, Tailwind) in Uzbek (default), Russian and English.

## Run

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # builds the site; pages are generated ahead of time
npm start        # runs the production server on port 3000
npm run preview  # same, on port 3100, to test offline and install next to `npm run dev`
npm run lint
```

The site runs as a Node.js server, because orders go through `/api/order`. See [DEPLOY.md](DEPLOY.md) for
putting it on a server. Copy `.env.example` to `.env.local` and fill it in.

Offline and install only work in the production build, and on a real domain only over HTTPS. Any order placed
from a server using your `.env.local`, including `npm run dev`, really is sent to the manager.

Set `NEXT_PUBLIC_SITE_URL` at build time if the site won't live at `https://www.musaffo.uz`
(used for canonical links, hreflang, the sitemap and social previews).

## Edit content

| To change | Edit |
|---|---|
| Products and categories | `data/products.ts` |
| Interface text | `i18n/uz.json`, `i18n/ru.json`, `i18n/en.json` |
| Certificates | `data/certificates.ts` and `public/brand/certificates/` |
| Contact details | `app/[locale]/contacts/page.tsx` and the `contacts` section of the i18n files |

**Add a product:** put its PNG in `public/products/{category}/` and add an entry to `products` in
`data/products.ts`. Its page, card, filters, sitemap entry and SEO tags are generated from that entry.
Products with the same `group` share one swipeable stage on the product page. `tint` sets the product's
colour (palette in `lib/tints.ts`). It also appears on its category's
shelf in the home page fridge. Shelf placement per category is the `LAYOUT` table in `components/Fridge.tsx`.

**Orders:** visitors build a list of boxes (`lib/order-list.ts`, page at `/{locale}/list/`), stored in their
browser. `/{locale}/quick/` is a compact sheet of every product for entering quantities fast, and the last order
can be repeated in one tap. Both use the same list. Placing an order posts it to `/api/order` (`lib/order-server.ts`), which looks up the products, sends
the manager a Telegram message and adds a line to `data/orders.jsonl`. Customers get no Telegram message.

**Order slip and "My orders":** after an order is placed, the list page shows the shop's own copy of it as a
till-style slip (`components/Receipt.tsx`): order number, date and time, who ordered (from the details the form just
saved; the order history itself keeps no names, phones or shops), every pack with boxes and pieces, totals and the
sales phone. "Rasm sifatida saqlash" draws the slip as a PNG in the browser (`lib/receipt.ts`) and
opens the phone's share sheet (Telegram, gallery), or downloads it where sharing files isn't supported. The bot still
only messages the manager. `/{locale}/orders/` (`components/OrdersPage.tsx`) lists the last 12 orders from that
device with their slips and "Takrorlash" (repeat), which puts an order back on the list at its quantities. It's
kept only in that browser, is noindex, and works offline.

**Delivery location:** on the order form, "Joylashuvimni qo‘shish" adds the phone's location (browser geolocation,
only on https, only when the customer taps it). The manager's message then has a "Xaritada ochish" Yandex Maps link,
and the bot sends a Telegram map pin replying to the order, which drivers can open in navigation. The location is
remembered with the shop's details in its browser and can be removed with ×. The server checks the coordinates
(`lib/geo.ts`); if only the pin fails to send, the order still counts as delivered, since the link is in the text.

**Search:** `lib/search.ts` powers the header search (every page), the catalog and quick order. It treats Uzbek
Latin and Cyrillic, Russian and Russian typed in Latin letters as one spelling, allows typos and word endings, and
understands sizes and fat ("kefir 900", "3,2%"). Words customers use that aren't in product names, like "шоколад"
for cocoa, go in its `CATEGORY_WORDS` and `TINT_WORDS` lists.

**Your usual order:** a shop that has ordered before is greeted by name at the top of "My orders" (`/{locale}/orders/`)
with the products it usually orders, each at its usual quantity. It's deliberately not on the home page, which is for showing
the products (`components/UsualOrder.tsx`, logic in `lib/usual.ts`). It's learned from
the last 12 orders placed on that device (`musaffo-order-history-v1` in its browser; nothing is stored on the server for
this). A product counts as usual when it was in the latest order, or in two or more once there are three. Quantities
can be changed or set to 0, and one tap puts the sheet on the order list. First-time visitors don't see it.

**Fill the shelf:** under every product page, the rest of its category stands on a fridge shelf
(`components/ShelfWalk.tsx`, styles under "Product page: the rest of the category" in `app/globals.css`). Each pack and
size can be added where it stands, a bar shows how much of the shelf is on the order list, one button adds one box
of every pack not yet on it (with undo, which takes back only those boxes), and "previous / next shelf" walks to the
neighbouring categories. Tapping a pack opens its page. The shelf is in the static HTML, so its links also work for
search engines.

**Home page:** it shows the products. The fridge has every pack and links each category. Below it,
`components/RangeShowcase.tsx` ("Mahsulotlarimiz") gives each category its own colour panel with a fan of large packs,
every flavour grouped by brand line, and figures computed from `data/products.ts` (number of flavours, fat, sizes); the
one-line description per category is `range.lead` in the i18n files. Each category's colour, pack shape and figures are
in `lib/range.ts`.

**Category pages:** each opens on its own colour stage (`components/CategoryStage.tsx`), the same as its home page panel:
the pack fan (`components/PackFan.tsx`), description and figures, with the six categories as coloured "aisles" above
it to walk between them. The product list with filters follows below. Packshots use a `srcset` (480 px and 900 px
WebP), so dense phone screens get the sharp file. Ordering is a single strip linking to quick
order, text orders and price labels. `components/HomeOrderHub.tsx` (the old ordering block) is no longer used on the
page and can be deleted.

**Orders written as text:** the box at the top of quick order (`/{locale}/quick/#paste`) and on the home page takes an order the way
people write it in a chat, pasted or dictated with the phone keyboard's microphone ("Kefir 1% 900 — 5 karobka",
"сырок какао 120 шт"). `lib/parse-order.ts` reads each line for boxes, pieces, size and fat and finds the product
with the search above. When the words fit several products, the size isn't named or a word isn't in the catalog,
the line asks for a tap instead of guessing. Words that never matter ("iltimos", "нужно") are in its `FILLER` list.
The installed app also accepts text shared from other apps (Telegram → Share → Musaffo), and
`/{locale}/quick/?text=...` links open with the text filled in.

**Price labels:** `/{locale}/labels/` lets a shop print Musaffo-styled shelf labels on A4 (large 2 × 4, or small
3 × 8) with the pack photo, name, size, fat and the shop's own price. The shop types its prices; they're kept
only in that browser (`lib/labels.ts`), never sent anywhere, and a label with no price prints a line to write on.
Products come from the order list (`?from=list`), the last order (`?from=last`), search or "all products". Labels
can be printed in any of the three languages. Layout and print sizes are in `app/globals.css` under "Shelf price labels".

**Scan to reorder:** each printed label carries a QR code (`lib/qr.ts`, using the `qrcode-generator` package) that
opens `/{locale}/r/?p=slug.amount` on the site the labels were printed from. That page (`components/ScanAdd.tsx`)
puts one box of the product on the order list straight away, with undo and a stepper; reloading doesn't count the
scan twice. A shop scans whatever runs low with the phone camera, then opens the list and orders. The scan page is in
the offline app's automatic core, so it works with weak signal. Codes can be switched off on the labels page.

**Share cards:** the picture shown when a link is shared in Telegram and other apps. Each product, category and
the brand has its own card in all three languages (`lib/og.tsx` draws them, `lib/share.ts` says which page uses which,
served at `.../share.png`). They're rendered during `npm run build` and update with the product data. The card font is
static Nunito in `assets/fonts/` (SIL Open Font License), because the image renderer can't use the site's web font.
Telegram caches previews per link: after changing a card, send the link to @WebpageBot to refresh it.

**Offline app:** `scripts/build-sw.mjs` runs after each build and generates the service worker from
`scripts/sw-template.js`. New pages and images are picked up automatically, and visitors get the new version
on their next visit. Icons are in `public/icons/`, app details in `public/manifest-*.webmanifest`.

**Replace a packshot:** overwrite the PNG with the same name. WebP versions regenerate on the next
`npm run dev` or `npm run build`.
