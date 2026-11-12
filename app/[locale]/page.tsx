import type { Metadata } from "next";
import { AppCard } from "@/components/AppCard";
import { Fridge } from "@/components/Fridge";
import Link from "@/components/Link";
import { RangeShowcase } from "@/components/RangeShowcase";
import { TrustBlock } from "@/components/TrustBlock";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/",
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(105deg,#0190d2_0%,#0077be_38%,#005aa9_72%)] text-white">
        <div className="mx-auto max-w-7xl px-3 pt-6 pb-14 sm:px-6 sm:pb-20 lg:pt-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-1 lg:mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-balance sm:text-4xl lg:text-5xl">{dict.home.heroTitle}</h1>
              <p className="mt-2 max-w-2xl text-base font-semibold text-pretty text-white/90 sm:text-lg">{dict.home.fridgeHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/catalog/`}
                className="inline-flex min-h-12 items-center rounded-full bg-white px-7 font-extrabold text-brand shadow-lg transition hover:bg-mist"
              >
                {dict.home.heroCta}
              </Link>
              <Link
                href={`/${locale}/quick/`}
                className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-6 font-extrabold text-white transition hover:bg-white/10"
              >
                {dict.quick.title}
              </Link>
            </div>
          </div>
          <Fridge locale={locale} />
        </div>
        {/* Milk wave, echoing the wave shape on Musaffo bottles */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-8 w-full text-white sm:h-14"
        >
          <path
            fill="currentColor"
            d="M0 42c120-26 240-34 360-16s240 44 360 30 240-52 360-50 240 28 360 34v30H0z"
          />
        </svg>
      </section>

      {/* The home page shows the products: the fridge has them all, the range below shows each category up close. */}
      <RangeShowcase locale={locale} />

      {/* Ordering has its own pages; here it's one line. */}
      <section data-order-strip aria-label={dict.order.place} className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-3xl bg-mist px-5 py-4">
          <p className="max-w-xl font-bold text-pretty text-navy">{dict.range.orderStrip}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/quick/`} className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-extrabold text-white transition hover:bg-brand-bright">
              {dict.quick.title}
            </Link>
            <Link href={`/${locale}/quick/#paste`} className="inline-flex min-h-11 items-center rounded-full border-2 border-brand bg-white px-5 font-extrabold text-brand transition hover:bg-mist">
              {dict.paste.entry}
            </Link>
            <Link href={`/${locale}/labels/`} className="inline-flex min-h-11 items-center rounded-full border-2 border-brand bg-white px-5 font-extrabold text-brand transition hover:bg-mist">
              {dict.labels.entry}
            </Link>
          </div>
        </div>
      </section>

      <TrustBlock locale={locale} />

      {process.env.NODE_ENV === "production" && <AppCard locale={locale} />}

      <p className="mx-auto max-w-2xl px-4 py-10 text-center text-lg font-semibold text-pretty text-slate sm:py-14">{dict.home.intro}</p>
    </>
  );
}
