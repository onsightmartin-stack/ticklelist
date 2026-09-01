import { mainlandDiffers, mainlandHighPoints } from "@/data/mainland-highpoints";
import { activeTerritoryRule } from "@/lib/definitions";
import { countsAsCountryHighpoint } from "@/lib/historic-highpoints";
import type { Ascent } from "@/lib/peak-catalog";

/**
 * Countries where the official (overseas) high point and the mainland summit
 * are different peaks, and the member's chosen territory rule decides which of
 * the two ticks the country off.
 */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const mainlandByCountry = new Map(
  mainlandHighPoints.filter((m) => mainlandDiffers.has(m.country)).map((m) => [m.country, m]),
);

/** Is this ascent the mainland summit of a country whose official HP is overseas? */
export const isMainlandHighpointAscent = (a: Pick<Ascent, "peak_name" | "country">): boolean => {
  const country = a.country;
  if (!country) return false;
  const mainland = mainlandByCountry.get(country);
  return !!mainland && norm(mainland.name) === norm(a.peak_name);
};

/**
 * The set of countries a member has ticked off as high points, honouring the
 * chosen mainland/territory rule.
 */
export function creditedHighpointCountries(ascents: Ascent[]): Set<string> {
  const rule = activeTerritoryRule();
  const out = new Set<string>();

  for (const a of ascents) {
    const mainland = isMainlandHighpointAscent(a);
    if (mainland) {
      if (rule !== "official") out.add(a.country as string);
      continue;
    }
    if (!countsAsCountryHighpoint(a)) continue;
    const country = a.country ?? a.peak_name;
    // Official overseas summit: only counts when overseas territories count.
    if (rule === "mainland" && mainlandByCountry.has(country)) continue;
    out.add(country);
  }

  return out;
}

/** Peak name that ticks a country under the active rule, for display. */
export const expectedHighpointName = (country: string): string | null =>
  mainlandByCountry.get(country)?.name ?? null;
