import Image from "next/image";
import type { ReactNode } from "react";
import Link from "./Link";
import { certificates } from "@/data/certificates";
import { getDictionary, type Locale } from "@/i18n";
import { fill } from "@/lib/format";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-7",
  "aria-hidden": true,
} as const;

export function LeafIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 19c0-8 5-14 15-15 0 10-4 16-12 16a6 6 0 0 1-3-1z" />
      <path d="M5 21c2-5 5-8 9-10" />
    </svg>
  );
}

export function ShieldCheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function FactoryIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21V10l6 4v-4l6 4V4h6v17z" />
      <path d="M7 17h2M12 17h2M17 17h1" />
    </svg>
  );
}

/** Home page: why trust the brand, with the certificates and a way to read more. */
export function TrustBlock({ locale }: { locale: Locale }) {
  const { trust, about } = getDictionary(locale);
  const cards: { icon: ReactNode; title: string; text: string }[] = [
    { icon: <LeafIcon />, title: trust.rawTitle, text: trust.rawText },
    { icon: <ShieldCheckIcon />, title: trust.qualityTitle, text: trust.qualityText },
    { icon: <FactoryIcon />, title: trust.productionTitle, text: trust.productionText },
  ];

  return (
    <section data-trust aria-labelledby="trust-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h2 id="trust-title" className="text-2xl font-black text-brand sm:text-3xl">
        {trust.title}
      </h2>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <li key={card.title} className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <span className="grid size-13 place-items-center rounded-2xl bg-leaf-soft text-leaf">{card.icon}</span>
            <h3 className="mt-4 text-lg font-extrabold text-navy">{card.title}</h3>
            <p className="mt-1 font-semibold text-pretty text-slate">{card.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-3xl bg-linear-to-br from-mist to-sky-soft/60 p-4 sm:px-6">
        <ul className="flex gap-3">
          {certificates.map((certificate, i) => (
            <li key={certificate.src}>
              <Image
                src={certificate.src}
                alt={fill(about.certificateAlt, { n: i + 1 })}
                width={certificate.width}
                height={certificate.height}
                sizes="4rem"
                className="h-20 w-auto rounded-lg bg-white shadow-sm"
              />
            </li>
          ))}
        </ul>
        <Link href={`/${locale}/about/`} className="inline-flex min-h-11 items-center font-extrabold text-brand underline-offset-2 hover:underline">
          {trust.more} <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </div>
    </section>
  );
}
