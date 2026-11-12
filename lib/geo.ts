/** A point the customer chose to share with the order (browser geolocation), and the map link for it. */
export type GeoPoint = { lat: number; lng: number; accuracy: number };

const MAX_ACCURACY_M = 100_000;

/** Checks what the browser sent. Missing means no location; anything malformed is an error, not silently dropped. */
export function parseGeoPoint(raw: unknown): GeoPoint | null | "invalid" {
  if (raw === undefined || raw === null) return null;
  const { lat, lng, accuracy } = (typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
  if (!finite(lat) || !finite(lng) || !finite(accuracy)) return "invalid";
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || accuracy < 0 || accuracy > MAX_ACCURACY_M) return "invalid";
  // About 10 cm: more digits than that only describe the phone's noise.
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return { lat: round(lat), lng: round(lng), accuracy: Math.round(accuracy) };
}

/** Yandex Maps is what drivers in Uzbekistan use most; it opens in the app on phones. */
export const mapUrl = ({ lat, lng }: Pick<GeoPoint, "lat" | "lng">) => `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`;
