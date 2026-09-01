/**
 * Complements the Peakbagger record with Eric & Matthew Gilbertson's surveys
 * at countryhighpoints.com — they GPS-survey disputed country high points
 * themselves, which is why several of our high points (Colombia, Saudi Arabia,
 * Togo, Gambia…) differ from older references.
 *
 * Scrapes every country page linked from the site's home page and writes
 * `src/data/countryhighpoints.json`: country -> { peak, elevationM, url }.
 *
 * Run: bun scripts/scrape-countryhighpoints.ts
 */
const OUT = "src/data/countryhighpoints.json";
const HOME = "https://www.countryhighpoints.com/";

export interface ChpRecord {
  country: string;
  peak?: string;
  elevationM?: number;
  /** Survey uncertainty in metres, when the report states one. */
  uncertaintyM?: number;
  lat?: number;
  lng?: number;
  url: string;
  fetchedAt: string;
}

const scrape = async (url: string): Promise<string> => {
  const base = process.env["AGW_URL"];
  const token = process.env["AGW_TOKEN"];
  if (!base || !token) throw new Error("AGW_URL / AGW_TOKEN missing");
  const res = await fetch(`${base}/f/website-fetch/v1/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data?: { markdown?: string } };
  return body.data?.markdown ?? "";
};

const NAV = /^(home|log in|search|uncategorized|archives|recent posts|recent comments|contact|about|blog|peakbagger\.com)$/i;

/** Country links live in the continent tables on the home page. */
export const parseCountryLinks = (markdown: string): { country: string; url: string }[] => {
  const out = new Map<string, string>();
  for (const m of markdown.matchAll(/\[([^\]]+)\]\((https:\/\/www\.countryhighpoints\.com\/[^)]+)\)/g)) {
    const country = m[1]!.trim();
    const url = m[2]!;
    if (/^!\[/.test(country) || country.length > 40 || NAV.test(country)) continue;
    if (/(instagram|facebook|twitter|feed|wp-content|\/20\d\d\/|#)/i.test(url)) continue;
    if (!out.has(country)) out.set(country, url);
  }
  return [...out].map(([country, url]) => ({ country, url }));
};

/**
 * Trip reports open with `# Country – Peak` followed by a summit line such as
 * `Jabal Ferwa (3,001.8 ± 0.7 m)`. That line is the surveyed figure; anything
 * else on the page is narrative and must not be read as the elevation.
 */
export const parseReport = (
  markdown: string,
): { peak?: string; elevationM?: number; uncertaintyM?: number; lat?: number; lng?: number } => {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const headingPeak = heading?.split(/\s[–—-]\s/)[1]?.trim();

  // Two report styles: `Peak (3,001.8 ± 0.7 m)` and `Peak – 12,461ft`.
  const summit =
    markdown.match(
      /^\s*([A-Z][^()\n]{2,60}?)\s*\(\s*([\d,]+(?:\.\d+)?)\s*(?:±\s*([\d.]+)\s*)?(m|meters?|metres?|ft|feet)\b[^)]*\)/m,
    ) ??
    markdown.match(
      /^\s*([A-Z][^\n]{2,60}?)\s*[–—-]\s*([\d,]+(?:\.\d+)?)\s*()(m|meters?|metres?|ft|feet)\b\s*$/m,
    );

  let elevationM: number | undefined;
  let uncertaintyM: number | undefined;
  let peak = headingPeak;
  if (summit) {
    const value = Number(summit[2]!.replace(/,/g, ""));
    const feet = /^f/i.test(summit[4]!);
    if (Number.isFinite(value)) {
      const metres = feet ? value * 0.3048 : value;
      if (metres > 0 && metres < 8900) {
        elevationM = Math.round(metres * 10) / 10;
        const u = summit[3] ? Number(summit[3]) : undefined;
        if (u !== undefined && Number.isFinite(u)) uncertaintyM = feet ? Math.round(u * 0.3048 * 10) / 10 : u;
      }
    }
    peak = peak ?? summit[1]!.trim();
  }

  const coords = markdown.match(/([NS])\s*(\d+\.\d+)°?,?\s*([EW])\s*(\d+\.\d+)°?/);
  const lat = coords ? Number(coords[2]) * (coords[1] === "S" ? -1 : 1) : undefined;
  const lng = coords ? Number(coords[4]) * (coords[3] === "W" ? -1 : 1) : undefined;

  return {
    ...(peak ? { peak } : {}),
    ...(elevationM !== undefined ? { elevationM } : {}),
    ...(uncertaintyM !== undefined ? { uncertaintyM } : {}),
    ...(lat !== undefined ? { lat, lng: lng! } : {}),
  };
};

const main = async () => {
  const home = await scrape(HOME);
  const links = parseCountryLinks(home);
  console.log(`${links.length} country pages`);

  const today = new Date().toISOString().slice(0, 10);
  const records: Record<string, ChpRecord> = {};
  try {
    Object.assign(records, JSON.parse(await Bun.file(OUT).text()));
  } catch {
    /* first run */
  }

  let cursor = 0;
  const worker = async () => {
    while (cursor < links.length) {
      const { country, url } = links[cursor++]!;
      if (records[country]) continue;
      try {
        const md = await scrape(url);
        const parsed = parseReport(md);
        records[country] = { country, ...parsed, url, fetchedAt: today };
        console.log(`${country}: ${parsed.peak ?? "?"} ${parsed.elevationM ?? "?"} m`);
      } catch (err) {
        console.log(`${country}: failed ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));

  const sorted = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)));
  await Bun.write(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`wrote ${Object.keys(sorted).length} records to ${OUT}`);
};

if (import.meta.main) await main();
