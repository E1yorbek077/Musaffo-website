import type { Metadata } from "next";
import { defaultLocale } from "@/i18n";

const target = `/${defaultLocale}/`;

export const metadata: Metadata = {
  title: "Musaffo",
  robots: { index: false },
};

// The site is static, so "/" forwards to the default language with a meta refresh.
export default function RootRedirectPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <a href={target}>Musaffo</a>
    </>
  );
}
