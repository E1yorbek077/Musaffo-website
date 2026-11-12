"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { AddToList } from "./AddToList";
import { Breadcrumbs } from "./Breadcrumbs";
import Link from "./Link";
import { LineBadge } from "./LineBadge";
import { ProductSpecs } from "./ProductSpecs";
import { ShelfWalk } from "./ShelfWalk";
import { categories, type CategorySlug, type Product } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { formatSize, webpPath } from "@/lib/format";
import { tintStyle } from "@/lib/tints";
import { productTitle } from "@/lib/titles";

/** Width of one pack's slot on the stage, per pack shape. Capped so the PDF images aren't over-stretched. */
const SLOT: Record<CategorySlug, string> = {
  "drinking-yogurt": "min(38cqw, 15rem)",
  "glazed-sirok": "min(38cqw, 15rem)",
  "kefir-ayron": "min(40cqw, 15rem)",
  milk: "min(46cqw, 16rem)",
  "thick-yogurt": "min(68cqw, 24rem)",
  "butter-qatiq": "min(78cqw, 26rem)",
};

const SWIPE_DISTANCE = 48;

const chipClass = (active: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center rounded-full border-2 px-4 font-extrabold whitespace-nowrap transition ${
    active
      ? "border-(--stage-ink) bg-(--stage-ink) text-white"
      : "border-white bg-white text-navy hover:border-(--stage-ink)"
  }`;

/**
 * The product page. Flavours of a product live on one stage: swiping or tapping changes the
 * product, colour and URL without a page load. Every flavour still has its own static page.
 */
export function ProductDetail({ product: initial, variants, locale }: { product: Product; variants: Product[]; locale: Locale }) {
  const dict = getDictionary(locale);
  const [slug, setSlug] = useState(initial.slug);
  const [amount, setAmount] = useState(initial.sizes[0].amount);

  const index = Math.max(0, variants.findIndex((v) => v.slug === slug));
  const product = variants[index] ?? initial;
  const size = product.sizes.find((s) => s.amount === amount) ?? product.sizes[0];
  const name = product.name[locale];
  const variantKind = categories.find((c) => c.slug === product.category)?.variantKind;

  const select = (target: Product | undefined) => {
    if (!target || target.slug === slug) return;
    setSlug(target.slug);
    // Replace, so Back returns to where the visitor came from instead of through every flavour.
    window.history.replaceState(window.history.state, "", `/${locale}/products/${target.slug}/`);
  };

  /*
   * The pack the page opened with is drawn straight from the sharp 900px file. Every other pack shows the
   * lighter 480px file; when it becomes the centred one, the sharp file is laid over it and fades in once
   * that image has loaded. Nothing on screen is ever swapped out, so a slow connection never shows a blank.
   */
  const openedWith = size.image;
  const [initialImage] = useState(openedWith);
  const [sharpLoaded, setSharpLoaded] = useState<Set<string>>(() => new Set());
  const markSharp = (image: string) => setSharpLoaded((loaded) => (loaded.has(image) ? loaded : new Set(loaded).add(image)));

  // Keeps the tab title and description right after a switch that didn't load a new page.
  const description = product.description[locale];
  useEffect(() => {
    document.title = productTitle(product, locale);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [product, locale, description]);

  /* Keep the active chip in view in the sideways-scrolling row on phones. */
  const chipRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = chipRow.current;
    const chip = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [slug]);

  /* Swipe or drag between flavours. */
  const box = useRef<HTMLDivElement>(null);
  const gesture = useRef({ id: -1, startX: 0, dx: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (variants.length < 2 || e.button !== 0) return;
    gesture.current = { id: e.pointerId, startX: e.clientX, dx: 0, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    if (!g.moved) {
      if (Math.abs(dx) < 8) return;
      g.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("is-dragging");
    }
    g.dx = dx;
    const pastEnd = (dx > 0 && index === 0) || (dx < 0 && index === variants.length - 1);
    e.currentTarget.style.setProperty("--drag", `${pastEnd ? dx * 0.3 : dx}px`);
  };
  const finishGesture = (e: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const g = gesture.current;
    if (g.id !== e.pointerId) return;
    g.id = -1;
    e.currentTarget.classList.remove("is-dragging");
    e.currentTarget.style.removeProperty("--drag");
    if (commit && g.moved && Math.abs(g.dx) >= SWIPE_DISTANCE) select(variants[index + (g.dx < 0 ? 1 : -1)]);
  };
  // A drag that ends on a neighbouring pack must not also count as tapping it.
  const onClickCapture = (e: MouseEvent) => {
    if (!gesture.current.moved) return;
    gesture.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const word = product.short?.[locale] ?? product.flavour?.[locale] ?? name;
  const wordLines = word.split(" ");
  const wordStyle = {
    "--chars": Math.max(...wordLines.map((w) => w.length)),
    "--lines": wordLines.length,
  } as CSSProperties;

  return (
    <div data-pack-scope className="tint-scope" style={tintStyle(product.tint)}>
      <section className="flavour-stage relative overflow-hidden">
        <div className="stage-grid mx-auto max-w-7xl px-4 pt-3 pb-12 sm:px-6 md:pt-6 md:pb-20">
          <div className="[grid-area:crumbs]">
            <Breadcrumbs
              label={dict.nav.breadcrumb}
              className="text-(--stage-ink)"
              items={[
                { label: dict.nav.catalog, href: `/${locale}/catalog/` },
                { label: dict.categories[product.category], href: `/${locale}/catalog/${product.category}/` },
              ]}
            />
          </div>

          <div
            ref={box}
            data-stage
            className={`pack-box -mx-4 sm:-mx-6 md:mx-0 ${variants.length > 1 ? "cursor-grab" : ""}`}
            style={{ "--active": index, "--slot": SLOT[product.category] } as CSSProperties}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => finishGesture(e, true)}
            onPointerCancel={(e) => finishGesture(e, false)}
            onClickCapture={onClickCapture}
          >
            <p key={product.slug} className="stage-word" style={wordStyle} aria-hidden="true">
              {wordLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>

            {variants.map((v, n) => {
              const active = n === index;
              const shown = v.sizes.find((s) => s.amount === amount) ?? v.sizes[0];
              // The smaller of two sizes stands visibly smaller on the stage.
              const smaller = v.sizes.length > 1 && shown === v.sizes[0];
              const baseIsSharp = shown.image === initialImage;
              // Once a pack's sharp layer has loaded it stays, even after the pack moves aside.
              const sharpLayer = !baseIsSharp && (active || sharpLoaded.has(shown.image));
              return (
                <button
                  key={v.id}
                  type="button"
                  tabIndex={active ? -1 : 0}
                  aria-current={active ? "true" : undefined}
                  aria-label={active ? `${v.name[locale]}, ${formatSize(shown, dict)}` : v.flavour?.[locale] ?? v.name[locale]}
                  data-active={active ? "" : undefined}
                  data-fly-source={active ? "" : undefined}
                  onClick={() => select(v)}
                  className="stage-slide"
                  style={{ "--n": n } as CSSProperties}
                >
                  {/* The shadow is on the wrapper, so the two layers cast one shadow between them. */}
                  <span key={shown.image} className={`stage-pack relative flex w-full items-center justify-center ${smaller ? "h-[76%] self-end" : "h-full"}`}>
                    <picture className="flex h-full w-full items-center justify-center">
                      <source srcSet={webpPath(shown.image, baseIsSharp ? "stage" : "thumb")} type="image/webp" />
                      <img
                        src={shown.image}
                        alt=""
                        draggable={false}
                        fetchPriority={v.slug === initial.slug ? "high" : "auto"}
                        className="max-h-full max-w-full object-contain"
                      />
                    </picture>
                    {sharpLayer && (
                      <img
                        data-sharp-layer
                        src={webpPath(shown.image, "stage")}
                        alt=""
                        draggable={false}
                        onLoad={() => markSharp(shown.image)}
                        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${sharpLoaded.has(shown.image) ? "opacity-100" : "opacity-0"}`}
                      />
                    )}
                  </span>
                </button>
              );
            })}

            {variants.length > 1 && (
              <>
                <StageArrow side="left" disabled={index === 0} label={dict.product.previous} onClick={() => select(variants[index - 1])} />
                <StageArrow side="right" disabled={index === variants.length - 1} label={dict.product.next} onClick={() => select(variants[index + 1])} />
              </>
            )}
          </div>

          <div className="relative z-10 [grid-area:info] md:self-center">
            <LineBadge line={product.line} />
            <h1 className="mt-1 text-xl leading-tight font-black text-balance text-(--stage-ink) sm:text-2xl md:mt-2 md:text-4xl lg:text-5xl">{name}</h1>
            <p data-product-description className="mt-1 text-sm leading-snug font-semibold text-pretty text-(--stage-ink) sm:text-base md:mt-3 md:text-lg">
              {description}
            </p>

            {variants.length > 1 && (
              <div className="mt-3 md:mt-6">
                <h2 className="mb-2 font-extrabold text-(--stage-ink) max-md:sr-only">
                  {variantKind === "type" ? dict.product.type : dict.product.flavour}
                </h2>
                <div ref={chipRow} className="stage-chips relative -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                  {variants.map((v) => (
                    <Link
                      key={v.id}
                      href={`/${locale}/products/${v.slug}/`}
                      scroll={false}
                      aria-current={v.id === product.id ? "page" : undefined}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        select(v);
                      }}
                      className={chipClass(v.id === product.id)}
                    >
                      {v.flavour?.[locale] ?? v.name[locale]}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 1 && (
              <div className="mt-2 md:mt-5">
                <h2 className="mb-2 font-extrabold text-(--stage-ink) max-md:sr-only">{dict.product.size}</h2>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s.image} type="button" aria-pressed={s === size} onClick={() => setAmount(s.amount)} className={chipClass(s === size)}>
                      {formatSize(s, dict)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 sm:max-w-sm md:mt-6">
              <AddToList key={`${product.slug}.${size.amount}`} product={product} size={size} locale={locale} showPieces />
            </div>
          </div>
        </div>

        {/* Milk wave, echoing the wave shape on Musaffo bottles */}
        <svg aria-hidden="true" viewBox="0 0 1440 70" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-8 w-full text-white sm:h-14">
          <path fill="currentColor" d="M0 42c120-26 240-34 360-16s240 44 360 30 240-52 360-50 240 28 360 34v30H0z" />
        </svg>
      </section>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-4 sm:px-6">
        <ProductSpecs product={product} size={size} locale={locale} />
      </div>

      <ShelfWalk product={product} size={size} locale={locale} />
    </div>
  );
}

function StageArrow({ side, disabled, label, onClick }: { side: "left" | "right"; disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-(--stage-ink) shadow-md transition hover:scale-105 disabled:opacity-0 md:grid ${side === "left" ? "left-2" : "right-2"}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
