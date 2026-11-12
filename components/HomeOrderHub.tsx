"use client";

import Link from "./Link";
import { PasteOrder } from "./PasteOrder";
import { PriceLabel } from "./PriceLabels";
import { getProduct } from "@/lib/catalog";
import { getDictionary, type Locale } from "@/i18n";

/** The pack shown on the price-label card: a real label, as it prints. */
const SAMPLE = getProduct("kefir-1");

const STEP_ICONS = [
  // choose
  <path key="c" d="M4 6h16M4 12h10M4 18h7M17 15l2 2 4-4" />,
  // send
  <path key="s" d="M4 12l16-8-6 16-3-7-7-1z" />,
  // manager gets in touch
  <path key="m" d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z" />,
];

/**
 * Below the fridge, the home page answers what a shop wants next: how ordering works, and the quickest way
 * to do it. The paste box is the real one, so a chat message can become an order without leaving the page.
 */
export function HomeOrderHub({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const h = dict.home;
  const steps = [
    [h.step1Title, h.step1Text],
    [h.step2Title, h.step2Text],
    [h.step3Title, h.step3Text],
  ];
  const sample = SAMPLE?.sizes.find((s) => s.amount === 900) ?? SAMPLE?.sizes[0];

  return (
    <section data-order-hub className="mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-14">
      <h2 className="text-2xl font-black text-brand sm:text-3xl">{h.stepsTitle}</h2>
      <ol data-order-steps className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title} className="relative flex gap-4 rounded-3xl bg-mist/70 p-4 sm:flex-col sm:gap-3 sm:p-5">
            <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-md">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {STEP_ICONS[i]}
              </svg>
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-xs font-black text-brand ring-2 ring-brand">{i + 1}</span>
            </span>
            <div>
              <h3 className="text-lg font-black text-navy">{title}</h3>
              <p className="mt-0.5 font-semibold text-pretty text-slate">{text}</p>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow sm:grid">
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl font-black text-brand sm:text-3xl">{h.waysTitle}</h2>
      <p className="mt-1 font-semibold text-slate">{h.waysHint}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <PasteOrder locale={locale} />

        {/* A returning shop's repeat order lives at the top of the page (UsualOrder), so it isn't repeated here. */}
        <div className="space-y-4">

          <Link
            href={`/${locale}/quick/`}
            data-hub-card="quick"
            className="group flex items-center gap-4 rounded-3xl border-2 border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card"
          >
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-mist text-brand">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h12M8 12h12M8 18h12" />
                <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black text-navy">{dict.quick.title}</span>
              <span className="block text-sm font-semibold text-pretty text-slate">{dict.quick.hint}</span>
            </span>
            <span aria-hidden="true" className="text-2xl font-black text-brand transition group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href={`/${locale}/labels/`}
            data-hub-card="labels"
            className="group grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-4 overflow-hidden rounded-3xl border-2 border-line bg-linear-to-br from-white to-mist/70 p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card sm:grid-cols-[minmax(0,1fr)_11rem]"
          >
            <span className="min-w-0">
              <span className="block text-lg font-black text-navy">{dict.labels.title}</span>
              <span className="mt-0.5 block text-sm font-semibold text-pretty text-slate">{h.labelsText}</span>
              <span className="mt-3 inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-sm font-extrabold text-white transition group-hover:bg-navy">
                {h.labelsCta} →
              </span>
            </span>
            {SAMPLE && sample && (
              <span aria-hidden="true" className="block rotate-3 drop-shadow-lg transition duration-300 group-hover:rotate-0">
                <PriceLabel product={SAMPLE} size={sample} price={null} language={locale} />
              </span>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}
