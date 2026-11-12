import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * next/link with prefetching off. Pages like the catalog show dozens of links at once,
 * and prefetching them all would use up mobile data on pages nobody opens.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
