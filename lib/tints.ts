import type { CSSProperties } from "react";
import type { Tint } from "@/data/products";

/**
 * Each product's colour world, used on its stage and tiles.
 * soft: page background. mid: glow behind the pack. ink: text, readable on both.
 * Chosen from the flavour on the pack, or the fat label colour for milk.
 */
export const TINTS: Record<Tint, { soft: string; mid: string; ink: string }> = {
  strawberry: { soft: "#ffe1e4", mid: "#ff9aa6", ink: "#7f0f22" },
  pomegranate: { soft: "#fde0e6", mid: "#ef7f95", ink: "#6b0b22" },
  raspberry: { soft: "#fde0ee", mid: "#f28cba", ink: "#760d46" },
  cherry: { soft: "#fbdde2", mid: "#e8798b", ink: "#630a1f" },
  forest: { soft: "#e9e3fb", mid: "#ae9ae8", ink: "#37207a" },
  peach: { soft: "#ffe7d6", mid: "#ffb98a", ink: "#803407" },
  banana: { soft: "#fff5c9", mid: "#ffe06e", ink: "#6e5100" },
  pineapple: { soft: "#fff0bf", mid: "#ffd24d", ink: "#694600" },
  cocoa: { soft: "#f2e4d8", mid: "#cfa886", ink: "#4f2a10" },
  coconut: { soft: "#f5ecdd", mid: "#d9c3a0", ink: "#57421f" },
  vanilla: { soft: "#fff6d6", mid: "#f7dd85", ink: "#6f5404" },
  milk: { soft: "#e3f3fd", mid: "#9fd4f5", ink: "#004d93" },
  meadow: { soft: "#e3f6ef", mid: "#9adcc2", ink: "#0c5a3e" },
  lagoon: { soft: "#dff5f5", mid: "#8bdcdc", ink: "#0a5560" },
  basil: { soft: "#efe6f7", mid: "#c3a4e0", ink: "#4b2074" },
  immun: { soft: "#ffeccf", mid: "#ffc266", ink: "#733800" },
  butter: { soft: "#fff4cc", mid: "#ffdf7a", ink: "#6f5404" },
};

export function tintStyle(tint: Tint): CSSProperties {
  const { soft, mid, ink } = TINTS[tint];
  return { "--stage-soft": soft, "--stage-mid": mid, "--stage-ink": ink } as CSSProperties;
}
