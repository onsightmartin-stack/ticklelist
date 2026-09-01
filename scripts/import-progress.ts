/**
 * Records Peakbagger import progress into `public.peakbagger_import_runs`
 * / `public.peakbagger_import_events` so the admin dashboard can show it.
 *
 * Uses the preconfigured psql environment (PGHOST/PGUSER/... already set).
 *
 * Usage:
 *   bun scripts/import-progress.ts start --lists-total 890            -> prints run id
 *   bun scripts/import-progress.ts update <runId> --lists-done 418 --peaks 26234 \
 *        --batches-applied 7 --batches-total 12 --rows 16478 --lists-blocked 3
 *   bun scripts/import-progress.ts error <runId> "batch-004 failed: permission denied" [--scope load]
 *   bun scripts/import-progress.ts log <runId> "batch-004 applied" [--scope load]
 *   bun scripts/import-progress.ts finish <runId> [--status done|failed]
 */
const argv = process.argv.slice(2);
const cmd = argv[0];

const flag = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i > 0 ? argv[i + 1] : undefined;
};
const num = (name: string) => {
  const v = flag(name);
  return v === undefined ? undefined : Number(v);
};
const lit = (v: string) => `'${v.replace(/'/g, "''")}'`;

const psql = async (sql: string) => {
  const proc = Bun.spawn(["psql", "-Atq", "-c", sql], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(err.trim() || `psql exited ${code}`);
  return out.trim();
};

const setPairs = () => {
  const map: Record<string, number | undefined> = {
    lists_total: num("lists-total"),
    lists_done: num("lists-done"),
    lists_blocked: num("lists-blocked"),
    peaks_captured: num("peaks"),
    batches_total: num("batches-total"),
    batches_applied: num("batches-applied"),
    rows_upserted: num("rows"),
  };
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && Number.isFinite(v))
    .map(([k, v]) => `${k} = ${v}`);
};

const main = async () => {
  if (cmd === "start") {
    const id = await psql(
      `INSERT INTO public.peakbagger_import_runs (status, lists_total) VALUES ('running', ${num("lists-total") ?? 0}) RETURNING id;`,
    );
    console.log(id);
    return;
  }

  const runId = argv[1];
  if (!runId) throw new Error("run id required");

  if (cmd === "update") {
    const sets = setPairs();
    if (!sets.length) throw new Error("nothing to update");
    await psql(
      `UPDATE public.peakbagger_import_runs SET ${sets.join(", ")}, updated_at = now() WHERE id = ${lit(runId)};`,
    );
    console.log("ok");
    return;
  }

  if (cmd === "error" || cmd === "log") {
    const message = argv[2];
    if (!message) throw new Error("message required");
    const level = cmd === "error" ? "error" : "info";
    await psql(
      `INSERT INTO public.peakbagger_import_events (run_id, level, scope, message) VALUES (${lit(runId)}, ${lit(level)}, ${flag("scope") ? lit(flag("scope")!) : "NULL"}, ${lit(message)});`,
    );
    if (level === "error") {
      await psql(
        `UPDATE public.peakbagger_import_runs SET last_error = ${lit(message)}, updated_at = now() WHERE id = ${lit(runId)};`,
      );
    }
    console.log("ok");
    return;
  }

  if (cmd === "finish") {
    const status = flag("status") ?? "done";
    await psql(
      `UPDATE public.peakbagger_import_runs SET status = ${lit(status)}, finished_at = now(), updated_at = now() WHERE id = ${lit(runId)};`,
    );
    console.log("ok");
    return;
  }

  throw new Error(`unknown command: ${cmd}`);
};

await main();
