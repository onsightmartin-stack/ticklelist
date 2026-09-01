import { countries } from "@/data/countries";
import { peakCatalog, type CatalogPeak } from "@/lib/peak-catalog";
import { slugify } from "@/lib/slug";
import { mainSiteHref } from "@/lib/site-links";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const countryNames = new Set(countries.map((c) => norm(c.country)));

/** The country whose /peak/ page a peak name belongs to, if any. */
export const peakCountry = (peakName: string | null | undefined): string | null => {
  if (!peakName) return null;
  const q = norm(peakName);
  if (!q) return null;

  // "Ben Nevis · United Kingdom" style values, and plain country names.
  const parts = q.split(/[·|,(]/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const asCountry = countries.find((c) => norm(c.country) === part);
    if (asCountry) return asCountry.country;
  }

  const head = parts[0] ?? q;
  const hit =
    peakCatalog.find((p) => p.type === "country_highpoint" && norm(p.name) === head) ??
    peakCatalog.find((p) => norm(p.name) === head);
  if (hit && countryNames.has(norm(hit.country))) return hit.country;
  return null;
};

/** Link to the matching country highpoint page, or null when there is none. */
export const peakPageHref = (peakName: string | null | undefined): string | null => {
  const country = peakCountry(peakName);
  return country ? mainSiteHref(`/peak/${slugify(country)}`) : null;
};

/** Label stored on a post for a picked catalog peak. */
export const peakLabel = (peak: CatalogPeak) => `${peak.name} · ${peak.country}`;
