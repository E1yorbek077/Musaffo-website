"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { fill, plural } from "@/lib/format";
import { mapUrl, parseGeoPoint, type GeoPoint } from "@/lib/geo";
import { listTotals, type ResolvedLine } from "@/lib/order-list";
import { formatPhone, isCompletePhone, localDigits, SALES_PHONE } from "@/lib/phone";

const SAVED_KEY = "musaffo-customer-v1";
const MAX_COMMENT = 500;

type CustomerType = "shop" | "person";
type Saved = { customerType: CustomerType; name: string; phone: string; shop: string; address: string; location: GeoPoint | null };
type Field = "name" | "phone" | "shop" | "address";

const EMPTY: Saved = { customerType: "shop", name: "", phone: "", shop: "", address: "", location: null };

function readSaved(): Saved {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "{}") as Partial<Saved>;
    return {
      customerType: saved.customerType === "person" ? "person" : "shop",
      name: typeof saved.name === "string" ? saved.name : "",
      phone: typeof saved.phone === "string" && /^\d{0,9}$/.test(saved.phone) ? saved.phone : "",
      shop: typeof saved.shop === "string" ? saved.shop : "",
      address: typeof saved.address === "string" ? saved.address : "",
      // A shop orders from the same place every time, so its location is remembered with its details.
      location: (() => {
        const point = parseGeoPoint(saved.location);
        return point === "invalid" ? null : point;
      })(),
    };
  } catch {
    return EMPTY;
  }
}

const INPUT =
  "mt-1 min-h-12 w-full rounded-2xl border-2 border-line bg-white px-4 font-semibold text-navy outline-none transition placeholder:font-medium placeholder:text-slate/70 focus:border-sky aria-invalid:border-engil";

/** Opens as a bottom sheet on phones and a centred panel on larger screens. */
export function OrderForm({
  locale,
  lines,
  onClose,
  onPlaced,
}: {
  locale: Locale;
  lines: ResolvedLine[];
  onClose: () => void;
  onPlaced: (orderNumber: string) => void;
}) {
  const dict = getDictionary(locale);
  const t = dict.order;
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Saved>(readSaved);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [errors, setErrors] = useState<Field[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "failed" | "limited">("idle");
  const [failedNumber, setFailedNumber] = useState<string | null>(null);
  const [geo, setGeo] = useState<"idle" | "locating" | "denied" | "failed">("idle");
  // Browsers only offer geolocation on https (and localhost). The form is opened by a tap, so this never runs on the server.
  const canLocate = typeof navigator !== "undefined" && "geolocation" in navigator && window.isSecureContext;

  const locate = () => {
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const point = parseGeoPoint({ lat: latitude, lng: longitude, accuracy });
        if (point && point !== "invalid") set("location", point);
        setGeo(point && point !== "invalid" ? "idle" : "failed");
      },
      (failure) => setGeo(failure.code === failure.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  // On a phone the error can appear below the visible part of the form, and it holds the number to call.
  const errorBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === "failed" || status === "limited") errorBox.current?.scrollIntoView({ block: "center" });
  }, [status]);

  const set = <K extends keyof Saved>(key: K, value: Saved[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => current.filter((field) => field !== key));
  };

  const totals = listTotals(lines);
  const isShop = values.customerType === "shop";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;

    const invalid: Field[] = [];
    if (!values.name.trim()) invalid.push("name");
    if (!isCompletePhone(values.phone)) invalid.push("phone");
    if (isShop && !values.shop.trim()) invalid.push("shop");
    if (!values.address.trim()) invalid.push("address");
    setErrors(invalid);
    if (invalid.length > 0) {
      dialog.current?.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)?.focus();
      return;
    }

    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(values));
    } catch {
      // Without storage the customer simply types their details again next time.
    }

    setStatus("sending");
    setFailedNumber(null);
    try {
      // The trailing slash matches the site's URL style and avoids a redirect.
      const response = await fetch("/api/order/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerType: values.customerType,
          name: values.name,
          phone: `+998${values.phone}`,
          shop: isShop ? values.shop : "",
          address: values.address,
          ...(values.location ? { location: values.location } : {}),
          comment,
          website,
          locale,
          items: lines.map((line) => ({ slug: line.slug, size: line.amount, boxes: line.qty })),
        }),
      });
      const result = (await response.json()) as { ok: boolean; orderNumber?: string; error?: string };
      if (result.ok && result.orderNumber) {
        onPlaced(result.orderNumber);
        return;
      }
      setFailedNumber(result.orderNumber ?? null);
      setStatus(result.error === "rate_limited" ? "limited" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  const error = (field: Field, text: string) =>
    errors.includes(field) ? (
      <p id={`order-${field}-error`} className="mt-1 text-sm font-bold text-engil">
        {text}
      </p>
    ) : null;
  const invalidProps = (field: Field) =>
    errors.includes(field) ? { "aria-invalid": true, "aria-describedby": `order-${field}-error` } : {};

  return (
    <dialog
      ref={dialog}
      data-order-form
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (e.target === dialog.current && status !== "sending") dialog.current?.close();
      }}
      className="quick-view mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white text-navy md:m-auto md:max-w-xl md:rounded-3xl"
    >
      <form onSubmit={submit} noValidate className="relative p-5 sm:p-7">
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          disabled={status === "sending"}
          aria-label={dict.product.close}
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-brand hover:bg-mist"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 className="pr-10 text-2xl font-black text-brand">{t.title}</h2>
        <p className="mt-1 font-bold text-slate">
          {plural(locale, totals.products, dict.list.products)} · {plural(locale, totals.boxes, dict.list.boxes)} · {plural(locale, totals.pieces, dict.list.pieces)}
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">{t.customerType}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-mist p-1">
            {(["shop", "person"] as const).map((type) => (
              <label
                key={type}
                className={`relative grid min-h-11 cursor-pointer place-items-center rounded-full font-extrabold transition has-focus-visible:outline-3 has-focus-visible:outline-sky ${
                  values.customerType === type ? "bg-brand text-white" : "text-brand"
                }`}
              >
                <input type="radio" name="customerType" value={type} checked={values.customerType === type} onChange={() => set("customerType", type)} className="absolute size-px opacity-0" />
                {type === "shop" ? t.typeShop : t.typePerson}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-3">
          <Label text={t.name}>
            <input name="name" type="text" autoComplete="name" maxLength={100} value={values.name} onChange={(e) => set("name", e.target.value)} className={INPUT} {...invalidProps("name")} />
            {error("name", t.errorName)}
          </Label>

          <Label text={t.phone}>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              // The prefix appears on focus, so customers only need to type their own 9 digits.
              value={formatPhone(values.phone) || (phoneFocused ? "+998 " : "")}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              onChange={(e) => set("phone", localDigits(e.target.value))}
              className={INPUT}
              {...invalidProps("phone")}
            />
            {error("phone", t.errorPhone)}
          </Label>

          {isShop && (
            <Label text={t.shop}>
              <input name="shop" type="text" autoComplete="organization" maxLength={100} value={values.shop} onChange={(e) => set("shop", e.target.value)} className={INPUT} {...invalidProps("shop")} />
              {error("shop", t.errorShop)}
            </Label>
          )}

          <Label text={t.address}>
            <input name="address" type="text" autoComplete="street-address" maxLength={200} value={values.address} onChange={(e) => set("address", e.target.value)} className={INPUT} {...invalidProps("address")} />
            {error("address", t.errorAddress)}
          </Label>

          {canLocate && (
            <div data-location className="rounded-2xl bg-mist/70 p-3">
              {values.location ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span data-location-added className="inline-flex items-center gap-1.5 font-extrabold text-leaf-dark">
                    <PinIcon />
                    {t.locationAdded}
                  </span>
                  <span className="text-sm font-bold text-slate">{fill(t.locationAccuracy, { meters: values.location.accuracy })}</span>
                  <a href={mapUrl(values.location)} target="_blank" rel="noopener noreferrer" className="text-sm font-extrabold text-brand underline underline-offset-2">
                    {t.locationView}
                  </a>
                  <button
                    type="button"
                    data-location-remove
                    onClick={() => set("location", null)}
                    aria-label={t.locationRemove}
                    className="ml-auto grid size-9 place-items-center rounded-full text-xl font-black text-slate transition hover:bg-white hover:text-navy"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-location-add
                  onClick={locate}
                  disabled={geo === "locating"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-brand/30 bg-white px-4 font-extrabold text-brand transition hover:border-brand disabled:opacity-70"
                >
                  {geo === "locating" ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" /> : <PinIcon />}
                  {geo === "locating" ? t.locationLocating : t.locationAdd}
                </button>
              )}
              <p data-location-note aria-live="polite" className={`mt-1.5 text-xs font-semibold text-pretty ${geo === "denied" || geo === "failed" ? "text-navy" : "text-slate"}`}>
                {geo === "denied" ? t.locationDenied : geo === "failed" ? t.locationFailed : t.locationHint}
              </p>
            </div>
          )}

          <Label text={t.comment}>
            <textarea name="comment" rows={2} maxLength={MAX_COMMENT} value={comment} onChange={(e) => setComment(e.target.value)} className={`${INPUT} resize-y py-3`} />
            <span className="mt-0.5 block text-right text-xs font-bold text-slate">
              {comment.length} / {MAX_COMMENT}
            </span>
          </Label>
        </div>

        {/* Hidden from people, tempting to bots. The server discards orders that fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {(status === "failed" || status === "limited") && (
          <div ref={errorBox} role="alert" data-order-error className="mt-4 rounded-2xl bg-engil-soft px-4 py-3 font-semibold text-pretty text-navy">
            <p>{status === "limited" ? t.errorLimited : t.errorFailed}</p>
            <p className="mt-1">
              {t.errorCall}{" "}
              <a href={`tel:${SALES_PHONE.tel}`} className="font-extrabold whitespace-nowrap text-brand underline">
                {SALES_PHONE.display}
              </a>
            </p>
            {failedNumber && <p className="mt-1 text-sm">{fill(t.errorReference, { number: failedNumber })}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 font-extrabold text-white transition hover:bg-brand-bright disabled:opacity-70"
        >
          {status === "sending" && <span aria-hidden="true" className="size-5 animate-spin rounded-full border-3 border-white/40 border-t-white" />}
          <span aria-live="polite">{status === "sending" ? t.sending : t.submit}</span>
        </button>
        <p className="mt-2 text-center text-sm font-semibold text-pretty text-slate">{t.privacy}</p>
      </form>
    </dialog>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block font-extrabold text-navy">
      {text}
      {children}
    </label>
  );
}
