import { peakCatalog, type CatalogPeak } from "@/lib/peak-catalog";

export interface PeakbaggerRow {
  /** Peak name exactly as it appears on Peakbagger */
  peak: string;
  /** ISO date (YYYY-MM-DD) of the ascent */
  date: string;
  /** Location column, if present */
  location?: string | undefined;
}

export interface MatchedAscent {
  row: PeakbaggerRow;
  matches: CatalogPeak[];
}

/** Lower-case, strip diacritics/punctuation so "Großglockner" ≈ "Grossglockner". */
export const normalizePeakName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(mount|mt|mont|monte|peak|pico|pic|cerro|gunung|jebel|mount\.)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** Pull an ISO date out of a Peakbagger row ("2026-07-11", "Jul 11, 2026", "11 Jul 2026"). */
export const extractDate = (text: string): string | null => {
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const mdy = text.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdy && MONTHS[mdy[1]!.toLowerCase()]) {
    return `${mdy[3]}-${MONTHS[mdy[1]!.toLowerCase()]}-${mdy[2]!.padStart(2, "0")}`;
  }

  const dmy = text.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/);
  if (dmy && MONTHS[dmy[2]!.toLowerCase()]) {
    return `${dmy[3]}-${MONTHS[dmy[2]!.toLowerCase()]}-${dmy[1]!.padStart(2, "0")}`;
  }
  return null;
};

/**
 * Parse a pasted Peakbagger ascent list. Handles tab-separated table copies as
 * well as plain text lines — anything with a peak name and a date works.
 */
export const parsePeakbaggerText = (text: string): PeakbaggerRow[] => {
  const rows: PeakbaggerRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const date = extractDate(line);
    if (!date) continue;

    // Prefer column structure when the paste kept tabs / multiple spaces.
    const cols = line.split(/\t|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    let peak = "";
    let location: string | undefined;

    if (cols.length > 1) {
      // The peak name is the first column that is not a number, rank or date.
      peak = cols.find((c) => !/^\d[\d,.'\s]*$/.test(c) && !extractDate(c)) ?? cols[0]!;
      location = cols.find((c) => c !== peak && !/^[\d,.'\s]*$/.test(c) && !extractDate(c));
    } else {
      peak = line.replace(/(\d{4}-\d{2}-\d{2}).*$/, "").trim();
      peak = peak.replace(/[\d,.'"\-–—|]+$/, "").trim();
    }

    peak = peak.replace(/^\d+[).\s]+/, "").trim();
    if (peak.length < 2) continue;

    rows.push({ peak, date, location });
  }

  // Dedupe identical peak + date pairs.
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = `${normalizePeakName(r.peak)}|${r.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const catalogIndex = peakCatalog.flatMap((p) =>
  [p.name, ...(p.altNames ?? [])].map((n) => ({ peak: p, norm: normalizePeakName(n) })),
);

/** Match a Peakbagger peak name to catalog entries (a shared summit can match several countries). */
export const matchPeak = (name: string, location?: string): CatalogPeak[] => {
  const n = normalizePeakName(name);
  if (!n) return [];

  let hits = [...new Set(catalogIndex.filter((c) => c.norm === n).map((c) => c.peak))];
  if (hits.length === 0) {
    hits = [
      ...new Set(
        catalogIndex
          .filter((c) => c.norm.length > 3 && (c.norm.includes(n) || n.includes(c.norm)))
          .map((c) => c.peak),
      ),
    ];
  }

  // A shared summit listed with a location narrows down to that country.
  if (hits.length > 1 && location) {
    const loc = location.toLowerCase();
    const narrowed = hits.filter((h) => loc.includes(h.country.toLowerCase()));
    if (narrowed.length > 0) return narrowed;
  }
  return hits;
};

/** Match every parsed row against the logabble peak catalog. */
export const matchPeakbaggerRows = (rows: PeakbaggerRow[]): MatchedAscent[] =>
  rows.map((row) => ({ row, matches: matchPeak(row.peak, row.location) }));
