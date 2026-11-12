import type { Metadata } from "next";
import { getDictionary, type Locale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/contacts/",
    title: `${dict.meta.contactsTitle} | Musaffo`,
    description: dict.meta.contactsDescription,
  });
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params;
  const { contacts } = getDictionary(locale);

  const rows = [
    { label: contacts.producer, value: "MCHJ QK «Milk House»" },
    { label: contacts.website, value: "www.musaffo.uz" },
    { label: contacts.phone, value: contacts.soon, pending: true },
    { label: contacts.email, value: contacts.soon, pending: true },
    { label: contacts.address, value: contacts.soon, pending: true },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-black text-brand sm:text-4xl">{contacts.title}</h1>
      <p className="mt-3 text-lg font-semibold text-slate">{contacts.placeholder}</p>
      <dl className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white px-6 shadow-card">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
            <dt className="font-bold text-slate">{row.label}</dt>
            <dd className={row.pending ? "font-semibold text-slate" : "font-extrabold text-navy"}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
