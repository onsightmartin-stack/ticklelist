/**
 * Turns the scraped Peakbagger list rows (`scrape-peakbagger-lists.ts` output)
 * into batched SQL upserts for `public.peakbagger_peaks`.
 *
 * By default already-imported peaks whose facts are unchanged are dropped, so a
 * re-run only emits batches with genuinely new/changed rows (`--all` disables).
 *
 * Run: bun scripts/load-peakbagger-peaks.ts --in /tmp/pb/rows.jsonl --outdir /tmp/pb/sql [--batch 4000] [--all]
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

import { psql } from "./lib/psql";

interface Row {
  pid: string;
  peak: string;
  elevM: number;
  promM?: number;
  country?: string;
  range?: string;
}

const q = (v: string | undefined) => (v === undefined ? "NULL" : `'${v.replace(/'/g, "''")}'`);

const arg = (flag: string, fallback: string) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};

const main = async () => {
  const input = arg("--in", "/tmp/pb/rows.jsonl");
  const outdir = arg("--outdir", "/tmp/pb/sql");
  const batch = Number(arg("--batch", "4000"));

  const byPid = new Map<string, Row>();
  for (const line of (await Bun.file(input).text()).split("\n")) {
    if (!line.trim()) continue;
    const r = JSON.parse(line) as Row;
    const prev = byPid.get(r.pid);
    // Prefer the record that carries prominence / location detail.
    if (!prev || (prev.promM === undefined && r.promM !== undefined)) byPid.set(r.pid, r);
  }
  let rows = [...byPid.values()];
  console.log(`${rows.length} distinct peaks`);

  if (!process.argv.includes("--all")) {
    // Skip peaks already imported with identical facts, so re-runs stay small.
    const existing = new Map<string, string>();
    const dump = await psql(
      `SELECT pid || E'\\t' || round(elevation)::text || E'\\t' || COALESCE(round(prominence)::text, '') FROM public.peakbagger_peaks;`,
    );
    for (const line of dump.split("\n")) {
      if (!line) continue;
      const [pid, ...rest] = line.split("\t");
      if (pid) existing.set(pid, rest.join("\t"));
    }
    const before = rows.length;
    rows = rows.filter(
      (r) =>
        existing.get(r.pid) !==
        `${Math.round(r.elevM)}\t${r.promM === undefined ? "" : String(Math.round(r.promM))}`,
    );
    console.log(`${before - rows.length} unchanged peaks skipped, ${rows.length} to upsert`);
  }

  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });
  if (!rows.length) {
    console.log("nothing to do");
    return;
  }
  let file = 0;
  for (let i = 0; i < rows.length; i += batch) {
    const values = rows
      .slice(i, i + batch)
      .map(
        (r) =>
          `(${q(r.pid)},${q(r.peak)},${r.elevM},${r.promM ?? "NULL"},${q(r.country)},${q(r.range)})`,
      )
      .join(",\n");
    const sql = `INSERT INTO public.peakbagger_peaks (pid, name, elevation, prominence, location, range) VALUES\n${values}\nON CONFLICT (pid) DO UPDATE SET name = EXCLUDED.name, elevation = EXCLUDED.elevation, prominence = COALESCE(EXCLUDED.prominence, public.peakbagger_peaks.prominence), location = COALESCE(EXCLUDED.location, public.peakbagger_peaks.location), range = COALESCE(EXCLUDED.range, public.peakbagger_peaks.range), fetched_at = now();\n`;
    const path = `${outdir}/batch-${String(++file).padStart(3, "0")}.sql`;
    writeFileSync(path, sql);
    console.log(`wrote ${path}`);
  }
};

if (import.meta.main) await main();
