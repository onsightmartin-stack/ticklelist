/**
 * Pure parser for Peakbagger list pages (metric view).
 * Shared by the bulk scraper script and the daily scrape endpoint.
 * Peakbagger is the only source of record for peak facts on this site.
 */

export interface ListRow {
  pid: string;
  peak: string;
  elevM: number;
  promM?: number | undefined;
  country?: string | undefined;
  range?: string | undefined;
  lid: string;
}

const num = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const n = Number(raw.replace(/,/g, "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/** Parse a Peakbagger list page (metric) by reading its header row. */
export const parseListMarkdown = (markdown: string, lid: string): ListRow[] => {
  const rows: ListRow[] = [];
  const seen = new Set<string>();
  let elevCol = -1;
  let promCol = -1;
  let countryCol = -1;
  let rangeCol = -1;

  for (const line of markdown.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());

    if (elevCol < 0 && /Elev-M/i.test(line)) {
      const find = (re: RegExp) => cells.findIndex((c) => re.test(c));
      elevCol = find(/Elev-M/i);
      promCol = find(/Prom-M/i);
      countryCol = find(/\b(Country|Nation|Location|State|Region)\b/i);
      rangeCol = find(/Range/i);
      continue;
    }

    if (elevCol < 0 || !line.includes("peak.aspx?pid=")) continue;
    const m = line.match(/\[([^\]]+)\]\(https:\/\/peakbagger\.com\/peak\.aspx\?pid=(\d+)\)/);
    if (!m) continue;
    const pid = m[2]!;
    if (seen.has(pid)) continue;

    const elevM = num(cells[elevCol]);
    if (elevM === undefined || elevM < -450 || elevM > 8850) continue;
    const promM = promCol >= 0 ? num(cells[promCol]) : undefined;

    const plain = (i: number) =>
      i >= 0 && cells[i] ? cells[i]!.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim() || undefined : undefined;

    seen.add(pid);
    rows.push({
      pid,
      peak: m[1]!.trim(),
      elevM,
      ...(promM !== undefined && promM >= 0 && promM <= elevM ? { promM } : {}),
      ...(plain(countryCol) ? { country: plain(countryCol) } : {}),
      ...(plain(rangeCol) ? { range: plain(rangeCol) } : {}),
      lid,
    });
  }
  return rows;
};

/**
 * Pull the decimal WGS84 coordinates out of a Peakbagger peak page.
 * The page renders them as "Latitude/Longitude (WGS84) | 27.988257, 86.925145 (Dec Deg)".
 */
export const parsePeakCoords = (markdown: string): { lat: number; lon: number } | null => {
  const m = markdown.match(
    /Latitude\/Longitude[^|]*\|\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
  );
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
};
