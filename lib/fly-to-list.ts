/**
 * Purely visual: a copy of the pack flies from the product to the order bar,
 * so the first tap makes clear where the item went. Skipped for reduced motion.
 */
export function flyToList(origin: Element) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const scope = origin.closest("[data-pack-scope]");
  // On the product stage several packs are visible; the active one is what gets added.
  const image = scope?.querySelector("[data-fly-source] img") ?? scope?.querySelector("img");
  if (!(image instanceof HTMLImageElement)) return;
  const from = image.getBoundingClientRect();
  if (from.width === 0) return;

  const clone = document.createElement("img");
  clone.src = image.currentSrc || image.src;
  clone.alt = "";
  clone.setAttribute("data-fly-clone", "");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: "contain",
    zIndex: "60",
    pointerEvents: "none",
    margin: "0",
  });
  // An open <dialog> sits in the top layer, so the copy has to fly inside it to stay visible.
  (document.querySelector("dialog[open]") ?? document.body).append(clone);

  // The bar may not exist yet on the first add; it always appears at the bottom centre.
  const bar = document.querySelector("[data-order-bar]")?.getBoundingClientRect();
  const toX = bar ? bar.left + 32 : window.innerWidth / 2;
  const toY = bar ? bar.top + bar.height / 2 : window.innerHeight - 40;
  const dx = toX - (from.left + from.width / 2);
  const dy = toY - (from.top + from.height / 2);

  const animation = clone.animate(
    [
      { transform: "none", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 40}px) scale(0.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 620, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)" },
  );
  const remove = () => clone.remove();
  animation.onfinish = remove;
  animation.oncancel = remove;
}
