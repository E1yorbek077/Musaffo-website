import type { ReactNode } from "react";
import { BoxIcon, BottleIcon, PercentIcon, ThermoClockIcon } from "./SpecIcons";
import type { Product, ProductSize } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { fill, formatFat, formatShelfLife, formatSize } from "@/lib/format";

/** Shared by the product page and the fridge quick view. */
export const chipClass = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full border-2 px-4 font-extrabold transition ${
    active ? "border-brand bg-brand text-white" : "border-line bg-white text-navy hover:border-sky hover:text-brand"
  }`;

export function ProductSpecs({ product, size, locale }: { product: Product; size: ProductSize; locale: Locale }) {
  const dict = getDictionary(locale);
  return (
    <section className="@container rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-black text-brand">{dict.product.specs}</h2>
      <dl className="mt-4 grid grid-cols-3 gap-2 @md:gap-4">
        <Spec icon={<PercentIcon />} label={dict.product.fat} value={formatFat(product.fatPercent, locale)} />
        <Spec icon={<BottleIcon />} label={size.unit === "L" ? dict.product.volume : dict.product.weight} value={formatSize(size, dict)} />
        <Spec icon={<BoxIcon />} label={dict.product.perBox} value={fill(dict.product.pieces, { count: size.piecesPerBox })} />
      </dl>
      <div className="mt-5 flex gap-3 border-t border-line pt-5">
        <IconTile>
          <ThermoClockIcon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate">{dict.product.storage}</h3>
          <ul className="mt-1 space-y-1">
            {product.storage.map((rule) => (
              <li key={rule.tempRange} className="flex flex-wrap justify-between gap-x-4 font-extrabold text-navy">
                <span className="whitespace-nowrap">{rule.tempRange}</span>
                <span className="whitespace-nowrap">{formatShelfLife(rule, locale, dict)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function IconTile({ children }: { children: ReactNode }) {
  return <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf-soft text-leaf">{children}</span>;
}

function Spec({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="relative min-w-0 pt-13 @md:min-h-11 @md:pt-0 @md:pl-14">
      <dt className="text-sm leading-tight font-bold text-slate @md:leading-normal">
        <span className="absolute top-0 left-0">
          <IconTile>{icon}</IconTile>
        </span>
        {label}
      </dt>
      <dd className="font-extrabold whitespace-nowrap text-navy">{value}</dd>
    </div>
  );
}
