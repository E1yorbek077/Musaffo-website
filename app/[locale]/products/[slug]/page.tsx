import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { products } from "@/data/products";
import { getDictionary, type Locale } from "@/i18n";
import { getProduct, SITE_URL, variantsOf } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { productShareImage } from "@/lib/share";

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return pageMetadata({
    locale,
    path: `/products/${slug}/`,
    title: `${product.name[locale]} | Musaffo`,
    description: product.description[locale],
    shareImage: productShareImage(locale, product),
  });
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const dict = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.description[locale],
    category: dict.categories[product.category],
    brand: { "@type": "Brand", name: product.line === "engil" ? "Engil" : "Musaffo" },
    manufacturer: { "@type": "Organization", name: "MCHJ QK «Milk House»" },
    image: product.sizes.map((s) => `${SITE_URL}${s.image}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductDetail product={product} variants={variantsOf(product)} locale={locale} />
    </>
  );
}
