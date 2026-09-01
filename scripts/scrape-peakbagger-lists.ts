/**
 * Bulk-scrapes Peakbagger peak lists (the only source of record for peak facts
 * on this site) and writes one JSONL row per peak to `--out`.
 *
 * Peakbagger publishes no bulk export, but its ~860 public lists cover roughly
 * 80,000 peak slots. Each list page is a single fetch, so the whole catalog is
 * a few hundred requests instead of a per-peak crawl.
 *
 * Run: bun scripts/scrape-peakbagger-lists.ts --lids /tmp/pb/lids.json --out /tmp/pb/rows.jsonl
 *
 * Resumable: already-scraped lids are skipped. Progress lives both in the local
 * `<out>.done` file and in `public.peakbagger_import_lists`, so a restart in a
 * fresh sandbox still resumes from the last successfully scraped list.
 */
import { createWriteStream } from "node:fs";

import { lit, psql } from "./lib/psql";

import { fetchPeakbagger } from "../src/lib/peakbagger-fetch.server";

export interface ListRow {
  pid: string;
  peak: string;
  elevM: number;
  promM?: number;
  country?: string;
  range?: string;
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

const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};

const main = async () => {
  const lidsFile = arg("--lids", "/tmp/pb/lids.json");
  const out = arg("--out", "/tmp/pb/rows.jsonl");
  const concurrency = Number(arg("--concurrency", "4"));
  const donePath = `${out}.done`;
  const runId = arg("--run", "");

  const lids = (JSON.parse(await Bun.file(lidsFile).text()) as { lid: string }[]).map((l) => l.lid);
  let done = new Set<string>();
  try {
    done = new Set((await Bun.file(donePath).text()).split("\n").filter(Boolean));
  } catch {
    /* first run */
  }
  try {
    const remote = await psql(`SELECT list_id FROM public.peakbagger_import_lists WHERE status = 'done';`);
    for (const lid of remote.split("\n").filter(Boolean)) done.add(lid);
  } catch (err) {
    console.log(`could not read remote progress: ${err instanceof Error ? err.message : String(err)}`);
  }
  const queue = lids.filter((l) => !done.has(l));
  console.log(`${queue.length} lists to scrape (${done.size} already done)`);

  const rowsSink = createWriteStream(out, { flags: "a" });
  const doneSink = createWriteStream(donePath, { flags: "a" });
  let cursor = 0;
  let total = 0;

  const recordList = async (lid: string, status: string, rowCount: number, error?: string) => {
    try {
      await psql(
        `INSERT INTO public.peakbagger_import_lists (list_id, run_id, status, row_count, error, scraped_at)
         VALUES (${lit(lid)}, ${runId ? lit(runId) : "NULL"}, ${lit(status)}, ${rowCount}, ${error ? lit(error.slice(0, 500)) : "NULL"}, now())
         ON CONFLICT (list_id) DO UPDATE SET run_id = COALESCE(EXCLUDED.run_id, public.peakbagger_import_lists.run_id),
           status = EXCLUDED.status, row_count = EXCLUDED.row_count, error = EXCLUDED.error, scraped_at = now();`,
      );
      if (runId) {
        await psql(
          `UPDATE public.peakbagger_import_runs SET
             lists_done = (SELECT count(*) FROM public.peakbagger_import_lists WHERE status = 'done'),
             lists_blocked = (SELECT count(*) FROM public.peakbagger_import_lists WHERE status <> 'done'),
             updated_at = now() WHERE id = ${lit(runId)};`,
        );
      }
    } catch {
      /* progress tracking must never break the crawl */
    }
  };

  const worker = async () => {
    while (cursor < queue.length) {
      const lid = queue[cursor++]!;
      try {
        const page = await fetchPeakbagger(`https://peakbagger.com/list.aspx?lid=${lid}&u=m`);
        if (page.blocked || !page.markdown) {
          console.log(`lid ${lid}: blocked`);
          await recordList(lid, "blocked", 0, "blocked by Peakbagger");
          continue;
        }
        const rows = parseListMarkdown(page.markdown, lid);
        for (const r of rows) rowsSink.write(`${JSON.stringify(r)}\n`);
        doneSink.write(`${lid}\n`);
        await recordList(lid, "done", rows.length);
        total += rows.length;
        console.log(`lid ${lid}: ${rows.length} rows (total ${total}, ${cursor}/${queue.length})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`lid ${lid}: error ${message}`);
        await recordList(lid, "failed", 0, message);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  rowsSink.end();
  doneSink.end();
  console.log(`scraped ${total} rows into ${out}`);
};

if (import.meta.main) await main();
