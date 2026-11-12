import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "out/**", "next-env.d.ts", "public/**"] },
  ...nextVitals,
  ...nextTs,
  {
    // Images are pre-optimised WebP files (scripts/optimize-images.mjs) with their own srcset, served as they are
    // (images.unoptimized in next.config.ts). next/image would add nothing, so plain <img> is intended.
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default config;
