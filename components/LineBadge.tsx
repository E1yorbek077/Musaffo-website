import type { BrandLine } from "@/data/products";

export const lineLabels: Record<BrandLine, string> = {
  musaffo: "Musaffo",
  engil: "Engil",
  immun: "IMMUN+",
};

const styles: Record<BrandLine, string> = {
  musaffo: "bg-mist text-brand",
  engil: "bg-engil-soft text-engil",
  immun: "bg-immun-soft text-immun",
};

export function LineBadge({ line }: { line: BrandLine }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold ${styles[line]}`}>
      {lineLabels[line]}
    </span>
  );
}
