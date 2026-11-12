"use client";

import { useEffect } from "react";

/**
 * Scrolls a sideways-scrolling row so its current item (aria-current) is in view, e.g. the category aisles on a phone,
 * where "Butter and qatiq" would otherwise start off-screen. Renders nothing.
 */
export function CurrentInView({ rowId }: { rowId: string }) {
  useEffect(() => {
    const row = document.getElementById(rowId);
    const current = row?.querySelector<HTMLElement>("[aria-current]");
    if (!row || !current || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2;
  }, [rowId]);
  return null;
}
