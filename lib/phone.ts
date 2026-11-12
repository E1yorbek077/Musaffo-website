/** Uzbek phone numbers: +998 XX XXX XX XX. Shared by the order form and the order API. */

export const SALES_PHONE = { display: "+998 78 120-33-34", tel: "+998781203334" };

/**
 * The 9 digits after +998, from the field's content. Numbers can really start with 998 (operator 99),
 * so a typed 998 only counts as a repeated prefix once the number runs past 9 digits.
 * That also handles someone typing +998 again after the prefix the field already shows.
 */
export function localDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.length > 9 && digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** "901234567" → "+998 90 123 45 67". Partial numbers format as far as they go. */
export function formatPhone(digits: string): string {
  if (!digits) return "";
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return `+998 ${groups.join(" ")}`;
}

export const isCompletePhone = (digits: string) => /^\d{9}$/.test(digits);

/** Strict version for the server: nothing is dropped, so a wrong number is rejected rather than cut short. */
export function parsePhone(value: string): string | null {
  const match = /^(?:\+?998)?(\d{9})$/.exec(value.replace(/[\s()-]/g, ""));
  return match ? match[1] : null;
}
