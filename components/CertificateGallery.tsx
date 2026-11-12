"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { certificates } from "@/data/certificates";
import { getDictionary, type Locale } from "@/i18n";
import { fill } from "@/lib/format";

/** Certificate thumbnails that open in a lightbox. Uses native <dialog> for focus handling and Esc. */
export function CertificateGallery({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const { about } = dict;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open !== null && !element.open) element.showModal();
    if (open === null && element.open) element.close();
  }, [open]);

  const step = (by: number) =>
    setOpen((current) => (current === null ? null : (current + by + certificates.length) % certificates.length));
  const current = open === null ? null : certificates[open];
  const hasMany = certificates.length > 1;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:gap-6">
        {certificates.map((certificate, i) => (
          <li key={certificate.src}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={fill(about.certificateOpen, { n: i + 1 })}
              className="group block w-full overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-card transition hover:-translate-y-0.5 hover:border-sky"
            >
              <Image
                src={certificate.src}
                alt={fill(about.certificateAlt, { n: i + 1 })}
                width={certificate.width}
                height={certificate.height}
                sizes="(min-width: 768px) 24rem, 50vw"
                className="h-auto w-full rounded-xl transition duration-300 group-hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        data-lightbox
        onClose={() => setOpen(null)}
        onClick={(e) => {
          // A click on the dialog element itself is a click on the backdrop.
          if (e.target === dialog.current) setOpen(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className="lightbox m-auto bg-transparent p-0"
      >
        {current && open !== null && (
          <div className="relative">
            <Image
              key={current.src}
              src={current.src}
              alt={fill(about.certificateAlt, { n: open + 1 })}
              width={current.width}
              height={current.height}
              sizes="90vw"
              className="h-auto max-h-[88dvh] w-auto max-w-[94vw] rounded-2xl md:h-[88dvh]"
            />
            <LightboxButton label={dict.product.close} onClick={() => setOpen(null)} className="top-2 right-2" path="M6 6l12 12M18 6L6 18" />
            {hasMany && (
              <>
                <LightboxButton label={dict.product.previous} onClick={() => step(-1)} className="top-1/2 left-2 -translate-y-1/2" path="M15 5l-7 7 7 7" />
                <LightboxButton label={dict.product.next} onClick={() => step(1)} className="top-1/2 right-2 -translate-y-1/2" path="M9 5l7 7-7 7" />
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function LightboxButton({ label, onClick, className, path }: { label: string; onClick: () => void; className: string; path: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute grid size-11 place-items-center rounded-full bg-white text-brand shadow-lg transition hover:bg-mist ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
