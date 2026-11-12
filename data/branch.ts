import type { Locale } from "@/i18n";

/**
 * The Musaffo Khorezm branch's own contact details. They come first in the footer and on the contacts page, and the
 * phone is the one on order slips and in the order form. A field left empty ("") is simply not shown anywhere.
 *
 * musaffo.uz is the main brand's separate website: it appears only as a link labelled as such (MAIN_BRAND_SITE).
 */
export const branch: {
  /** As it should be shown, e.g. "+998 62 123-45-67". The tel: link is made from its digits. */
  phone: string;
  /** Telegram username without @, e.g. "musaffo_xorazm". */
  telegram: string;
  address: Record<Locale, string>;
  /** Link to the branch on Yandex Maps or Google Maps. */
  mapUrl: string;
  hours: Record<Locale, string>;
  email: string;
} = {
  phone: "",
  telegram: "",
  address: { uz: "", ru: "", en: "" },
  mapUrl: "",
  hours: { uz: "", ru: "", en: "" },
  email: "",
};

export const MAIN_BRAND_SITE = { label: "www.musaffo.uz", url: "https://www.musaffo.uz/" };

export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, "")}`;
export const telegramHref = (username: string) => `https://t.me/${username.replace(/^@/, "")}`;
