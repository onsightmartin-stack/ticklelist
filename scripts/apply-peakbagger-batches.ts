/**
 * Applies the batch SQL files produced by `load-peakbagger-peaks.ts` and records
 * each batch in `public.peakbagger_import_batches`, keyed by a content checksum.
 *
 * Resumable end-to-end: a batch whose checksum is already recorded as `applied`
 * is skipped, so re-running after a crash (or in a fresh sandbox) only executes
 * the batches that never landed.
 *
 * Run: bun scripts/apply-peakbagger-batches.ts --dir /tmp/pb/sql [--run <runId>] [--link] [--force]
 */
import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";

import { lit, psql, psqlFile } from "./lib/psql";

const arg = (flag: string, fallback = "") => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? (process.argv[i + 1] ?? fallback) : fallback;
};
const has = (flag: string) => process.argv.includes(flag);

const logEvent = async (runId: string, level: "info" | "error", scope: string, message: string) => {
  if (!runId) return;
  await psql(
    `INSERT INTO public.peakbagger_import_events (run_id, level, scope, message) VALUES (${lit(runId)}, ${lit(level)}, ${lit(scope)}, ${lit(message)});`,
  );
  if (level === "error") {
    await psql(
      `UPDATE public.peakbagger_import_runs SET last_error = ${lit(message)}, updated_at = now() WHERE id = ${lit(runId)};`,
    );
  }
};

const main = async () => {
  const dir = arg("--dir", "/tmp/pb/sql");
  const runId = arg("--run");
  const force = has("--force");

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (!files.length) throw new Error(`no .sql batches in ${dir}`);

  const appliedChecksums = new Set(
    (await psql(`SELECT checksum FROM public.peakbagger_import_batches WHERE status = 'applied';`))
      .split("\n")
      .filter(Boolean),
  );

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, file] of files.entries()) {
    const path = `${dir}/${file}`;
    const text = await Bun.file(path).text();
    const checksum = createHash("sha256").update(text).digest("hex");
    const batchNo = index + 1;
    const rowCount = (text.match(/\n\(/g)?.length ?? 0) + (text.includes("VALUES\n(") ? 1 : 0);

    if (!force && appliedChecksums.has(checksum)) {
      skipped++;
      console.log(`${file}: already applied, skipping`);
      continue;
    }

    await psql(
      `INSERT INTO public.peakbagger_import_batches (run_id, batch_no, checksum, row_count, status)
       VALUES (${runId ? lit(runId) : "NULL"}, ${batchNo}, ${lit(checksum)}, ${rowCount}, 'pending')
       ON CONFLICT (checksum) DO UPDATE SET run_id = EXCLUDED.run_id, batch_no = EXCLUDED.batch_no,
         row_count = EXCLUDED.row_count, status = 'pending', error = NULL, updated_at = now();`,
    );

    try {
      await psqlFile(path);
      await psql(
        `UPDATE public.peakbagger_import_batches SET status = 'applied', applied_at = now(), error = NULL, updated_at = now() WHERE checksum = ${lit(checksum)};`,
      );
      applied++;
      console.log(`${file}: applied (${rowCount} rows)`);
      await logEvent(runId, "info", "load", `${file} applied (${rowCount} rows)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed++;
      await psql(
        `UPDATE public.peakbagger_import_batches SET status = 'failed', error = ${lit(message.slice(0, 2000))}, updated_at = now() WHERE checksum = ${lit(checksum)};`,
      );
      console.log(`${file}: FAILED ${message}`);
      await logEvent(runId, "error", "load", `${file} failed: ${message.slice(0, 500)}`);
    }

    if (runId) {
      await psql(
        `UPDATE public.peakbagger_import_runs r SET batches_total = ${files.length},
           batches_applied = (SELECT count(*) FROM public.peakbagger_import_batches WHERE status = 'applied'),
           rows_upserted = (SELECT count(*) FROM public.peakbagger_peaks), updated_at = now()
         WHERE r.id = ${lit(runId)};`,
      );
    }
  }

  if (has("--link")) {
    try {
      const linked = await psql(
        `WITH m AS (
           SELECT w.id, p.pid FROM public.world_peaks w
           JOIN public.peakbagger_peaks p ON p.world_peak_id = w.id
           WHERE w.peakbagger_id IS DISTINCT FROM p.pid
         )
         UPDATE public.world_peaks w SET peakbagger_id = m.pid FROM m WHERE w.id = m.id
         RETURNING 1;`,
      );
      const count = linked.split("\n").filter(Boolean).length;
      console.log(`linked ${count} world_peaks rows`);
      await logEvent(runId, "info", "link", `linked ${count} world_peaks rows to Peakbagger ids`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`link failed: ${message}`);
      await logEvent(runId, "error", "link", `link failed: ${message.slice(0, 500)}`);
    }
  }

  console.log(`done: ${applied} applied, ${skipped} skipped, ${failed} failed`);
  if (runId) {
    await psql(
      `UPDATE public.peakbagger_import_runs SET status = ${lit(failed ? "failed" : "done")}, finished_at = now(), updated_at = now() WHERE id = ${lit(runId)};`,
    );
  }
};

if (import.meta.main) await main();
