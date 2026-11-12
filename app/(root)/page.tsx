import type { Metadata } from "next";
import { defaultLocale, getDictionary } from "@/i18n";

const target = `/${defaultLocale}/`;
const siteName = getDictionary(defaultLocale).meta.siteName;

export const metadata: Metadata = {
  title: siteName,
  robots: { index: false },
};

// The site is static, so "/" forwards to the default language with a meta refresh.
export default function RootRedirectPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <a href={target}>{siteName}</a>
    </>
  );
}
