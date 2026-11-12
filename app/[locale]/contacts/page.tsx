import type { Metadata } from "next";
import type { ReactNode } from "react";
import { branch, MAIN_BRAND_SITE, telegramHref, telHref } from "@/data/branch";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { pageTitle } from "@/lib/titles";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/contacts/",
    title: pageTitle(dict.meta.contactsTitle, locale),
    description: dict.meta.contactsDescription,
  });
}

const LINK = "font-extrabold text-brand underline-offset-4 hover:underline";
type Row = { key: string; label: string; value: ReactNode };

/** The Khorezm branch's own contacts first (data/branch.ts; empty ones aren't shown), then the brand behind it. */
export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const { contacts } = dict;

  const branchRows: Row[] = [];
  if (branch.phone) branchRows.push({ key: "phone", label: contacts.phone, value: <a href={telHref(branch.phone)} className={LINK}>{branch.phone}</a> });
  if (branch.telegram) {
    branchRows.push({
      key: "telegram",
      label: contacts.telegram,
      value: (
        <a href={telegramHref(branch.telegram)} target="_blank" rel="noopener noreferrer" className={LINK}>
          @{branch.telegram.replace(/^@/, "")}
        </a>
      ),
    });
  }
  if (branch.address[locale]) {
    branchRows.push({
      key: "address",
      label: contacts.address,
      value: (
        <span className="block text-right">
          <span className="block font-extrabold text-navy">{branch.address[locale]}</span>
          {branch.mapUrl && (
            <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className={`${LINK} text-sm`}>
              {contacts.openMap} ↗
            </a>
          )}
        </span>
      ),
    });
  }
  if (branch.hours[locale]) branchRows.push({ key: "hours", label: contacts.hours, value: <span className="font-extrabold text-navy">{branch.hours[locale]}</span> });
  if (branch.email) branchRows.push({ key: "email", label: contacts.email, value: <a href={`mailto:${branch.email}`} className={LINK}>{branch.email}</a> });

  const brandRows: Row[] = [
    { key: "producer", label: contacts.producer, value: <span className="font-extrabold text-navy">MCHJ QK «Milk House»</span> },
    {
      key: "site",
      label: dict.footer.mainSite,
      value: (
        <a href={MAIN_BRAND_SITE.url} target="_blank" rel="noopener noreferrer" className={LINK}>
          {MAIN_BRAND_SITE.label} ↗
        </a>
      ),
    },
  ];

  const table = (rows: Row[]) => (
    <dl className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white px-6 shadow-card">
      {rows.map((row) => (
        <div key={row.key} data-contact={row.key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
          <dt className="font-bold text-slate">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-black text-brand sm:text-4xl">{contacts.title}</h1>
      <p className="mt-3 text-lg font-semibold text-slate">{contacts.intro}</p>

      {branchRows.length > 0 && (
        <section aria-labelledby="branch-title" className="mt-8" data-branch-contacts>
          <h2 id="branch-title" className="text-xl font-black text-navy">
            {dict.meta.siteName}
          </h2>
          {table(branchRows)}
        </section>
      )}

      <section aria-labelledby="brand-title" className="mt-8">
        <h2 id="brand-title" className="text-xl font-black text-navy">
          {contacts.brand}
        </h2>
        {table(brandRows)}
      </section>
    </div>
  );
}
