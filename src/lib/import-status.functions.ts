import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only: Peakbagger import runs + their events (RLS also enforces admin). */
export const peakbaggerImportStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: runs, error } = await context.supabase
      .from("peakbagger_import_runs")
      .select(
        "id, status, lists_total, lists_done, lists_blocked, peaks_captured, batches_total, batches_applied, rows_upserted, last_error, started_at, finished_at, updated_at",
      )
      .order("started_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);

    const { data: events, error: evErr } = await context.supabase
      .from("peakbagger_import_events")
      .select("id, run_id, level, scope, message, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (evErr) throw new Error(evErr.message);

    const { count } = await context.supabase
      .from("peakbagger_peaks")
      .select("pid", { count: "exact", head: true });

    const { data: batches, error: bErr } = await context.supabase
      .from("peakbagger_import_batches")
      .select("id, run_id, batch_no, checksum, row_count, status, error, applied_at")
      .order("batch_no", { ascending: true })
      .limit(200);
    if (bErr) throw new Error(bErr.message);

    const listCount = async (status?: string) => {
      let q = context.supabase
        .from("peakbagger_import_lists")
        .select("list_id", { count: "exact", head: true });
      if (status === "done") q = q.eq("status", "done");
      if (status === "pending") q = q.neq("status", "done");
      const { count: c } = await q;
      return c ?? 0;
    };

    return {
      runs: runs ?? [],
      events: events ?? [],
      referenceRows: count ?? 0,
      batches: batches ?? [],
      listsScraped: await listCount("done"),
      listsUnfinished: await listCount("pending"),
    };
  });
