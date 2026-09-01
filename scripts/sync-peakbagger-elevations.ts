/**
 * Pulls peak elevations from Peakbagger (the only source of record for peak
 * facts on this site) through the Firecrawl proxy and writes them to
 * `src/data/peakbagger-elevations.json`.
 *
 * Run:  bun scripts/sync-peakbagger-elevations.ts [--names "Peak A" "Peak B"]
 *
 * The JSON is a cache/audit trail: name -> { pid, elevationM, url, fetchedAt }.
 * Data files (countries.ts, famous-peaks.ts, …) are updated from it.
 */
import { fetchPeakbagger, searchPeakbaggerPid } from "../src/lib/peakbagger-fetch.server";

const OUT = "src/data/peakbagger-elevations.json";

export interface PeakbaggerRecord {
  pid: string;
  peak: string;
  elevationM: number;
  prominenceM?: number;
  country?: string;
  url: string;
  fetchedAt: string;
}

const load = async (): Promise<Record<string, PeakbaggerRecord>> => {
  try {
    return JSON.parse(await Bun.file(OUT).text());
  } catch {
    return {};
  }
};

const save = async (data: Record<string, PeakbaggerRecord>) => {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  await Bun.write(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
};

/** Scrape a Peakbagger list page (metric) into rows. */
export const scrapeList = async (lid: number) => {
  const page = await fetchPeakbagger(`https://peakbagger.com/list.aspx?lid=${lid}&u=m`);
  const rows: Array<{ group: string; pid: string; peak: string; elevM: number }> = [];
  const re =
    /<tr>(?:\s*<td>[\d.]+<\/td>)\s*<td>([^<]*)<\/td>\s*<td><a href="https:\/\/peakbagger\.com\/peak\.aspx\?pid=(\d+)">([^<]*)<\/a><\/td>\s*<td style="text-align: right">([\d.]+)/g;
  for (const m of page.html.matchAll(re)) {
    rows.push({ group: m[1]!, pid: m[2]!, peak: m[3]!, elevM: Number(m[4]) });
  }
  return rows;
};

/**
 * Parse any Peakbagger list page (metric) from its markdown table. Column
 * order differs per list type (elevation lists, prominence lists, isolation
 * lists…), so we read the header row and pick the Elev-M / Prom-M columns by
 * name. Guessing by position silently stores prominence as elevation.
 */
export const scrapeListMarkdown = async (lid: number) => {
  const page = await fetchPeakbagger(`https://peakbagger.com/list.aspx?lid=${lid}&u=m`);
  const rows: Array<{ pid: string; peak: string; elevM: number; promM?: number }> = [];
  const seen = new Set<string>();
  let elevCol = -1;
  let promCol = -1;

  const cellsOf = (line: string) => line.split("|").map((c) => c.trim());

  for (const line of (page.markdown || "").split("\n")) {
    const cells = cellsOf(line);

    if (elevCol < 0 && /Elev-M/i.test(line)) {
      elevCol = cells.findIndex((c) => /Elev-M/i.test(c));
      promCol = cells.findIndex((c) => /Prom-M/i.test(c));
      continue;
    }

    if (!line.includes("peak.aspx?pid=") || elevCol < 0) continue;
    const m = line.match(/\[([^\]]+)\]\(https:\/\/peakbagger\.com\/peak\.aspx\?pid=(\d+)\)/);
    if (!m) continue;
    const peak = m[1]!.trim();
    const pid = m[2]!;
    if (seen.has(pid)) continue;

    const num = (i: number) => {
      const raw = cells[i];
      if (raw === undefined) return undefined;
      const n = Number(raw.replace(/,/g, ""));
      return Number.isFinite(n) ? n : undefined;
    };
    const elevM = num(elevCol);
    if (elevM === undefined || elevM < -450 || elevM > 8850) continue;
    const promM = promCol >= 0 ? num(promCol) : undefined;
    seen.add(pid);
    rows.push({
      pid,
      peak,
      elevM,
      ...(promM !== undefined && promM <= elevM ? { promM } : {}),
    });
  }
  return rows;
};



const numFrom = (text: string, label: string): number | null => {
  const at = text.search(new RegExp(label, "i"));
  if (at < 0) return null;
  const window = text.slice(at, at + 140);
  const m = window.match(/(-?[\d,]+(?:\.\d+)?)\s*(?:meters?|metres?|m\b)/i);
  if (!m) return null;
  const n = Number(m[1]!.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Look one peak up by name (or pid) and return its Peakbagger facts. */
export const lookupPeak = async (
  name: string,
  hint = "",
): Promise<PeakbaggerRecord | null> => {
  const pid = /^\d+$/.test(name) ? name : (await searchPeakbaggerPid(`${name} ${hint}`.trim())).pid;
  if (!pid) return null;
  const page = await fetchPeakbagger(`https://peakbagger.com/peak.aspx?pid=${pid}`);
  if (page.blocked) return null;
  const text = (page.markdown || page.html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  const elevationM = numFrom(text, "Elevation");
  if (elevationM === null) return null;
  const prominenceM = numFrom(text, "Prominence");
  const peak =
    (page.markdown.match(/^#\s+(.+)$/m)?.[1] ?? page.html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1] ?? name)
      .split(",")[0]!
      .trim();
  return {
    pid,
    peak,
    elevationM,
    ...(prominenceM !== null ? { prominenceM } : {}),
    url: `https://peakbagger.com/peak.aspx?pid=${pid}`,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
};

const main = async () => {
  const args = process.argv.slice(2);
  const cache = await load();

  if (args[0] === "--names") {
    for (const name of args.slice(1)) {
      const rec = await lookupPeak(name);
      console.log(name, "→", rec ? `${rec.peak} ${rec.elevationM} m (pid ${rec.pid})` : "not found");
      if (rec) cache[name] = rec;
    }
    await save(cache);
    return;
  }

  if (args[0] === "--lists") {
    const today = new Date().toISOString().slice(0, 10);
    for (const lid of args.slice(1)) {
      const rows = await scrapeListMarkdown(Number(lid));
      console.log(`list ${lid}: ${rows.length} rows`);
      for (const r of rows) {
        const prev = cache[r.peak];
        // Country high-point records already carry a country label — keep it.
        cache[r.peak] = {
          pid: r.pid,
          peak: r.peak,
          elevationM: r.elevM,
          ...(prev?.country ? { country: prev.country } : {}),
          ...(r.promM !== undefined ? { prominenceM: r.promM } : {}),
          url: `https://peakbagger.com/peak.aspx?pid=${r.pid}`,
          fetchedAt: today,
        };
      }
      await save(cache);
    }
    console.log(`cache now holds ${Object.keys(cache).length} records`);
    return;
  }



  // Default: the world country high points list.
  const rows = await scrapeList(1100);
  console.log(`country high points: ${rows.length} rows`);
  const today = new Date().toISOString().slice(0, 10);
  for (const r of rows) {
    cache[r.peak] = {
      pid: r.pid,
      peak: r.peak,
      elevationM: r.elevM,
      country: r.group,
      url: `https://peakbagger.com/peak.aspx?pid=${r.pid}`,
      fetchedAt: today,
    };
  }
  await save(cache);
  console.log(`wrote ${Object.keys(cache).length} records to ${OUT}`);
};

if (import.meta.main) await main();
