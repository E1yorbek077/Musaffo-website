"use client";

import { getDictionary, type Locale } from "@/i18n";
import { fill, formatDecimal } from "@/lib/format";
import { promptInstall, saveCatalog, useOfflineState } from "@/lib/offline";


/** Home page offer: put the catalog on the phone. The download only starts when the visitor asks. */
export function AppCard({ locale }: { locale: Locale }) {
  const { app } = getDictionary(locale);
  const s = useOfflineState();
  const percent = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
  const size = s.bytes === null ? "" : fill(app.size, { n: formatDecimal(Math.round((s.bytes / 1048576) * 10) / 10, locale) });

  return (
    <section data-app-card aria-labelledby="app-card-title" className="relative overflow-hidden bg-[linear-gradient(115deg,#0a2f57,#004a8f_60%,#006cb7)] text-white print:hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-x-10 px-4 pt-10 sm:px-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:py-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-extrabold">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-3-2M2 8.8A15 15 0 0 1 6.5 6M22 8.8A15 15 0 0 0 11 5M12 20h.01" />
            </svg>
            {app.badge}
          </p>
          <h2 id="app-card-title" className="mt-3 text-3xl font-black tracking-tight text-balance sm:text-4xl">
            {app.title}
          </h2>
          <ul className="mt-4 space-y-2 font-semibold text-white/90">
            {[app.point1, app.point2, app.point3].map((point) => (
              <li key={point} className="flex gap-2.5">
                <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-[#7fe3ff]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 min-h-12">
            {s.supported && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {s.canInstall && !s.standalone && (
                    <button type="button" onClick={() => void promptInstall()} className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-extrabold text-brand shadow-lg transition hover:bg-mist">
                      {app.install}
                    </button>
                  )}
                  {(s.phase === "idle" || s.phase === "failed") && (
                    <button
                      type="button"
                      onClick={() => void saveCatalog()}
                      className={`inline-flex min-h-12 items-center rounded-full px-6 font-extrabold transition ${s.canInstall && !s.standalone ? "border-2 border-white text-white hover:bg-white/10" : "bg-white text-brand shadow-lg hover:bg-mist"}`}
                    >
                      {s.phase === "failed" ? app.retry : app.save}
                      {/* Full colour, not faded: faded blue on white fell below the 4.5:1 contrast minimum. */}
                      {size && <span className="ml-2 font-semibold">· {size}</span>}
                    </button>
                  )}
                </div>

                {s.phase === "saving" && (
                  <div className="max-w-md">
                    <p className="font-bold" aria-live="polite">
                      {app.saving} {percent}%
                    </p>
                    <div role="progressbar" aria-label={app.saving} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-[#7fe3ff] transition-[width] duration-200" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )}

                {s.phase === "saved" && (
                  <p data-app-saved className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-extrabold text-leaf-dark">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {app.saved}
                  </p>
                )}
                {s.phase === "failed" && <p className="font-semibold text-white/90">{app.failed}</p>}
                {s.ios && !s.standalone && <p className="max-w-md text-sm font-semibold text-white/85">{app.iosHint}</p>}
              </div>
            )}
          </div>
        </div>

        {/* A real screenshot of the site. On phones it is cut off by the section edge, like a phone in a pocket. */}
        <div className="mt-8 flex h-64 justify-center md:mt-0 md:h-auto" aria-hidden="true">
          <div className="w-56 shrink-0 rotate-3 self-start rounded-[2.2rem] bg-[#06223f] p-2 shadow-[0_24px_60px_rgb(0_20_50_/_0.6)] md:w-60">
            <img src={`/brand/app-phone-${locale}.webp`} alt="" width={390} height={844} loading="lazy" decoding="async" className="h-auto w-full rounded-[1.7rem]" />
          </div>
        </div>
      </div>
    </section>
  );
}
