/**
 * The site's own address, without a trailing slash: used for canonical links, hreflang alternates, Open Graph,
 * metadataBase, sitemap.xml and robots.txt. This is the Musaffo Khorezm branch's site, not musaffo.uz.
 *
 *   1. NEXT_PUBLIC_SITE_URL: set it to the custom domain once there is one.
 *   2. URL: set by Netlify during the build to the site's main address (the custom domain, or *.netlify.app).
 *   3. http://localhost:3000, but only in development.
 *
 * A production build with neither set stops with an error, so a wrong address can never be published.
 * Server-only: browsers don't have URL, so don't import this from a client component.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("Site address unknown: set NEXT_PUBLIC_SITE_URL (on Netlify, URL is set automatically during the build).");
}
