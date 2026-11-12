import en from "./en.json";
import ru from "./ru.json";
import uz from "./uz.json";

export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "uz";

export const localeNames: Record<Locale, string> = { uz: "O‘zbekcha", ru: "Русский", en: "English" };
export const localeShort: Record<Locale, string> = { uz: "UZ", ru: "RU", en: "EN" };

export type Dictionary = typeof uz;

// Every dictionary must have the same keys as uz.json; plural maps may have more forms.
const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
