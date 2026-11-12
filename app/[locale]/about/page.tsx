import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CertificateGallery } from "@/components/CertificateGallery";
import Link from "@/components/Link";
import { FactoryIcon, LeafIcon, ShieldCheckIcon } from "@/components/TrustBlock";
import { MAIN_BRAND_SITE } from "@/data/branch";
import { categories, products } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { pageTitle } from "@/lib/titles";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/about/",
    title: pageTitle(dict.meta.aboutTitle, locale),
    description: dict.meta.aboutDescription,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const { about } = dict;

  const stats: { top?: string; value: string; bottom?: string }[] = [
    { top: about.statSinceTop, value: about.statSinceValue, bottom: about.statSinceBottom },
    { top: about.statMilkTop, value: about.statMilkValue, bottom: about.statMilkBottom },
    { value: "650+", bottom: about.statPeopleBottom },
    { value: String(products.length), bottom: about.statProductsBottom },
    { value: String(categories.length), bottom: about.statCategoriesBottom },
  ];
  const timeline = [
    { year: "1974", text: about.event1974 },
    { year: "1995", text: about.event1995 },
    { year: "2016", text: about.event2016 },
    { year: "2025", text: about.event2025 },
  ];
  const quality: { icon: ReactNode; text: string }[] = [
    { icon: <LeafIcon />, text: about.qualityRaw },
    { icon: <ShieldCheckIcon />, text: about.qualityControl },
    { icon: <FactoryIcon />, text: about.qualityProduction },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(105deg,#0190d2_0%,#0077be_38%,#005aa9_72%)] text-white">
        <div className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14 sm:pb-28">
          <p className="font-extrabold text-white/85">{about.eyebrow}</p>
          {/* This is the Khorezm branch's site: the branch first, then the brand it represents. */}
          <h1 className="mt-2 text-4xl font-black tracking-tight text-balance sm:text-5xl">{about.branchTitle}</h1>
          <p data-branch-text className="mt-4 max-w-2xl text-lg font-semibold text-pretty text-white/90 sm:text-xl">
            {about.branchText}
          </p>
          <div className="mt-8 max-w-2xl rounded-3xl bg-white/12 p-5 ring-1 ring-white/25 backdrop-blur-sm sm:p-6">
            <h2 className="text-2xl font-black text-balance sm:text-3xl">{about.title}</h2>
            <p className="mt-2 font-semibold text-pretty text-white/90 sm:text-lg">{about.intro}</p>
            <p className="mt-3 font-semibold text-white/85">
              {dict.footer.mainSite}:{" "}
              <a href={MAIN_BRAND_SITE.url} target="_blank" rel="noopener noreferrer" className="font-extrabold text-white underline underline-offset-2">
                {MAIN_BRAND_SITE.label} ↗
              </a>
            </p>
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 70" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-8 w-full text-white sm:h-14">
          <path fill="currentColor" d="M0 42c120-26 240-34 360-16s240 44 360 30 240-52 360-50 240 28 360 34v30H0z" />
        </svg>
      </section>

      <section aria-labelledby="numbers-title" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <h2 id="numbers-title" className="sr-only">
          {about.numbersTitle}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((stat, i) => (
            <div
              key={stat.value}
              // The first two values can be long ("100 tonnagacha"), and the last tile would otherwise sit alone.
              className={`flex min-w-0 flex-col justify-center rounded-3xl bg-linear-to-br from-mist to-sky-soft/70 p-4 sm:p-5 lg:col-span-1 ${i < 2 || i === 4 ? "col-span-2" : ""}`}
            >
              {/* Reading order follows each language: "since 1974", "1974 yildan beri". */}
              <dd className={`font-black tracking-tight text-brand ${stat.value.length > 8 ? "text-3xl sm:text-4xl lg:text-2xl xl:text-3xl" : "text-3xl sm:text-4xl"}`}>
                {stat.top && <span className="block text-sm font-extrabold tracking-normal text-navy">{stat.top}</span>}
                {stat.value}
              </dd>
              {stat.bottom && <dt className="mt-1 text-sm leading-snug font-bold text-slate">{stat.bottom}</dt>}
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="history-title" className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
        <h2 id="history-title" className="text-2xl font-black text-brand sm:text-3xl">
          {about.historyTitle}
        </h2>
        <ol className="mt-6 border-l-4 border-sky-soft">
          {timeline.map((event) => (
            <li key={event.year} className="relative pb-8 pl-6 last:pb-0 sm:pl-8">
              <span aria-hidden="true" className="absolute top-1.5 -left-[0.7rem] size-4 rounded-full bg-brand ring-4 ring-white" />
              <p className="text-2xl font-black text-brand">{event.year}</p>
              <p className="mt-1 font-semibold text-pretty text-slate sm:text-lg">{event.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quality-title" className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
        <h2 id="quality-title" className="text-2xl font-black text-brand sm:text-3xl">
          {about.qualityTitle}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {quality.map((item) => (
            <li key={item.text} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-leaf-soft text-leaf">{item.icon}</span>
              <span className="font-extrabold text-navy">{item.text}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-8 text-xl font-black text-navy">{about.certificatesTitle}</h3>
        <div className="mt-4 max-w-2xl">
          <CertificateGallery locale={locale} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-brand-bright to-brand px-6 py-10 text-center text-white">
          <p className="text-2xl font-black text-balance sm:text-3xl">{about.ctaTitle}</p>
          <Link href={`/${locale}/catalog/`} className="inline-flex min-h-12 items-center rounded-full bg-white px-7 font-extrabold text-brand shadow-lg transition hover:bg-mist">
            {about.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
