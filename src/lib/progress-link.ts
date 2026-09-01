/**
 * Links the public project progress on onsightmartin.com with Martin's
 * Ticklelist community profile (@onsightmartin) — same person, one progress.
 *
 * The site dataset (`countries.ts`) carries nuance the community log cannot
 * express (mainland-only, legal high point, "visited but not summited"), so it
 * stays authoritative for those cases. Anything logged in the community profile
 * for a country that the site still lists as unclimbed is promoted to
 * "climbed", so a new tick in the app shows up on the website automatically.
 */
import { countries, type CountryHighPoint } from "@/data/countries";

/** Martin Gårdling / Onsight Martin — the same person on both sites. */
export const MARTIN_PROFILE_ID = "41bdde3c-dad9-4696-b864-bad186dd7a7a";
export const MARTIN_USERNAME = "onsightmartin";

export interface LoggedHighPoint {
  country: string;
  ascent_date: string | null;
}

/**
 * Merge logged community ascents into the shared country dataset in place.
 * Returns true when something actually changed (so callers can re-render).
 */
export function applyProgressOverlay(rows: LoggedHighPoint[]): boolean {
  let changed = false;
  const byCountry = new Map<string, string | null>();

  for (const row of rows) {
    const country = row.country?.trim();
    if (!country) continue;
    const existing = byCountry.get(country);
    // Keep the earliest known date for a country.
    if (existing === undefined || (row.ascent_date && (!existing || row.ascent_date < existing))) {
      byCountry.set(country, row.ascent_date ?? null);
    }
  }

  for (const entry of countries as CountryHighPoint[]) {
    const date = byCountry.get(entry.country);
    if (date === undefined) continue;

    // Only promote countries the site still lists as unclimbed. Mainland-only,
    // legal-high-point and "visited" entries are deliberate and stay put.
    if (entry.status === "not_visited") {
      entry.status = "climbed";
      changed = true;
    }

    if (date && (entry.year == null || entry.month == null)) {
      const [y, m] = date.split("-");
      if (y && entry.year == null) {
        entry.year = Number(y);
        changed = true;
      }
      if (m && entry.month == null) {
        entry.month = Number(m);
        changed = true;
      }
    }
  }

  return changed;
}

/** Countries the website counts as summited — used to keep the profile in sync. */
export const siteClimbedCountries = () =>
  countries.filter((c) => (c.status === "climbed" || c.status === "legal_high_point") && c.unMember !== false);
