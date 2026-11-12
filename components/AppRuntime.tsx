"use client";

import { useEffect } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { startOffline, useOnline } from "@/lib/offline";

/** Starts the service worker and tells the visitor when they are looking at the saved catalog. */
export function AppRuntime({ locale }: { locale: Locale }) {
  const online = useOnline();

  useEffect(() => {
    startOffline();
  }, []);

  if (online) return null;
  return (
    <p role="status" data-offline-strip className="sticky top-16 z-30 flex items-center justify-center gap-2 bg-navy px-4 py-1.5 text-center text-sm font-bold text-white print:hidden">
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-3-2M2 8.8A15 15 0 0 1 6.5 6M22 8.8A15 15 0 0 0 11 5M12 20h.01" />
      </svg>
      {getDictionary(locale).app.offlineStrip}
    </p>
  );
}
