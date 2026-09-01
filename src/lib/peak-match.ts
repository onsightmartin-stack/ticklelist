import { countries } from "@/data/countries";
import { peakCatalog } from "@/lib/peak-catalog";

/**
 * Deep link into the community ascent form with the right peak pre-selected.
 * Returns null when the country is not a catalog country high point.
 */
export function ascentLinkForCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  const match = countries.find(
    (c) => c.country.toLowerCase() === country.trim().toLowerCase(),
  );
  if (!match) return null;
  const key = `hp:${match.country}`;
  if (!peakCatalog.some((p) => p.key === key)) return null;
  return `/community/ascents?new=1&peak=${encodeURIComponent(key)}`;
}
