// Runs after `next build`. Writes two generated files into /public, which the server then serves:
//   sw.js                 the service worker, with the file lists built in
//   offline-manifest.json what "save the catalog" downloads
// "core" is cached automatically (the app's code and main pages). The rest, all pages and
// pack images, is only downloaded when the visitor asks or installs the app, because it
// costs them several megabytes of mobile data.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const staticDir = path.join(root, ".next", "static");
const pagesDir = path.join(root, ".next", "server", "app");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const relative = (from, file) => path.relative(from, file).split(path.sep).join("/");

/** Every file visitors can fetch: URL → file on disk. */
const sources = new Map();
for (const file of walk(publicDir)) sources.set(`/${relative(publicDir, file)}`, file);
for (const file of walk(staticDir)) if (!file.endsWith(".map")) sources.set(`/_next/static/${relative(staticDir, file)}`, file);

// Next stores prerendered pages as uz/catalog.html, which is served at /uz/catalog/.
const locales = ["uz", "ru", "en"];
const pages = [];
for (const file of walk(pagesDir)) {
  const rel = relative(pagesDir, file);
  if (rel === "index.html") {
    sources.set("/", file);
  } else if (new RegExp(`^(${locales.join("|")})(/.*)?\\.html$`).test(rel)) {
    const url = `/${rel.slice(0, -".html".length)}/`;
    sources.set(url, file);
    pages.push(url);
  }
}

const urls = [...sources.keys()];
const statics = urls.filter((u) => u.startsWith("/_next/static/"));
// The large .stage.webp packs aren't part of the saved catalog: offline, the service worker shows the
// .thumb.webp version instead, which keeps the download about 2 MB smaller.
const packs = urls.filter((u) => /\.(thumb|shelf)\.webp$/.test(u));
const brandImages = urls.filter((u) => /^\/brand\/(certificates\/|app-phone-)/.test(u));

// The scan page (/r/) is opened from shelf-label QR codes, often with weak signal at the back of a shop.
// "My orders" (/orders/) is where a shop shows its order slip to the driver, often with no signal.
const mainPages = ["/", ...locales.flatMap((l) => [`/${l}/`, `/${l}/catalog/`, `/${l}/quick/`, `/${l}/list/`, `/${l}/r/`, `/${l}/orders/`])];
const core = [...statics, ...mainPages, "/offline.html", "/brand/logo.svg", "/icons/icon-192.png"];
const full = [...pages.filter((p) => !mainPages.includes(p)), ...packs, ...brandImages];

for (const url of [...core, ...full]) {
  if (!sources.has(url)) throw new Error(`build-sw: nothing to serve at ${url}. Did next build run?`);
}

const hash = crypto.createHash("sha1");
for (const url of [...core, ...full].sort()) hash.update(url).update(fs.readFileSync(sources.get(url)));
const version = hash.digest("hex").slice(0, 12);
const cacheName = `musaffo-${version}`;
const bytes = (list) => list.reduce((sum, url) => sum + fs.statSync(sources.get(url)).size, 0);

fs.writeFileSync(
  path.join(publicDir, "offline-manifest.json"),
  JSON.stringify({ version, cache: cacheName, bytes: bytes(full), files: full }),
);

const template = fs.readFileSync(path.join(root, "scripts", "sw-template.js"), "utf8");
fs.writeFileSync(
  path.join(publicDir, "sw.js"),
  template.replace("__CACHE_NAME__", cacheName).replace('"__CORE__"', JSON.stringify(core)),
);

const mb = (n) => (n / 1048576).toFixed(2);
console.log(`service worker: version ${version}; core ${core.length} files, ${mb(bytes(core))} MB; catalog ${full.length} files, ${mb(bytes(full))} MB (before compression)`);
