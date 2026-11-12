import type { ReactNode } from "react";

// Bare layout for the "/" redirect; real pages use app/[locale]/layout.tsx.
export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
