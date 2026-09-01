/**
 * Daily Peakbagger scrape.
 *
 * Called by pg_cron once a day. Each run takes the least-recently-scraped
 * slice of the Peakbagger list catalog, re-scrapes those lists and upserts
 * every peak into `peakbagger_peaks`. Over time the whole catalog rotates,
 * so newly published peaks and corrected elevations flow in automatically.
 *
 * Auth: the Supabase publishable/anon key in the `apikey` header.
 */
import { createFileRoute } from "@tanstack/react-router";

import listIds from "@/data/peakbagger-list-ids.json";

const DEFAULT_BATCH = 30;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const handler = async ({ request }: { request: Request }) => {
  const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const provided = request.headers.get("apikey") ?? "";
  if (!anonKey || provided !== anonKey) return json({ error: "unauthorized" }, 401);

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? DEFAULT_BATCH) || DEFAULT_BATCH, 1), 60);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { fetchPeakbagger } = await import("@/lib/peakbagger-fetch.server");
  const { parseListMarkdown } = await import("@/lib/peakbagger-list-parse");

  const catalog = listIds as string[];

  // Pick the oldest-scraped lists first; lists never scraped come first of all.
  const { data: tracked } = await supabaseAdmin
    .from("peakbagger_import_lists")
    .select("list_id, scraped_at")
    .order("scraped_at", { ascending: true });

  const seenAt = new Map((tracked ?? []).map((r) => [r.list_id, r.scraped_at]));
  const queue = [...catalog]
    .sort((a, b) => {
      const av = seenAt.get(a) ?? "";
      const bv = seenAt.get(b) ?? "";
      return av === bv ? Number(a) - Number(b) : av < bv ? -1 : 1;
    })
    .slice(0, limit);

  const { data: run } = await supabaseAdmin
    .from("peakbagger_import_runs")
    .insert({ status: "running", lists_total: queue.length })
    .select("id")
    .single();
  const runId = run?.id ?? null;

  const log = async (level: string, message: string) => {
    if (!runId) return;
    await supabaseAdmin.from("peakbagger_import_events").insert({ run_id: runId, level, message, scope: "daily-cron" });
  };

  let peaks = 0;
  let inserted = 0;
  let blocked = 0;

  for (const lid of queue) {
    try {
      const page = await fetchPeakbagger(`https://peakbagger.com/list.aspx?lid=${lid}&u=m`);
      if (page.blocked || !page.markdown) {
        blocked++;
        await supabaseAdmin.from("peakbagger_import_lists").upsert({
          list_id: lid,
          run_id: runId,
          status: "blocked",
          row_count: 0,
          error: "blocked by Peakbagger",
          scraped_at: new Date().toISOString(),
        });
        continue;
      }

      const rows = parseListMarkdown(page.markdown, lid);
      peaks += rows.length;

      if (rows.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from("peakbagger_peaks")
          .select("pid")
          .in("pid", rows.map((r) => r.pid));
        const known = new Set((existing ?? []).map((r) => r.pid));
        inserted += rows.filter((r) => !known.has(r.pid)).length;

        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500).map((r) => ({
            pid: r.pid,
            name: r.peak,
            elevation: r.elevM,
            prominence: r.promM ?? null,
            location: r.country ?? null,
            range: r.range ?? null,
            fetched_at: new Date().toISOString(),
          }));
          const { error } = await supabaseAdmin.from("peakbagger_peaks").upsert(chunk, { onConflict: "pid" });
          if (error) throw new Error(error.message);
        }
      }

      await supabaseAdmin.from("peakbagger_import_lists").upsert({
        list_id: lid,
        run_id: runId,
        status: "done",
        row_count: rows.length,
        error: null,
        scraped_at: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await log("error", `lid ${lid}: ${message}`);
      await supabaseAdmin.from("peakbagger_import_lists").upsert({
        list_id: lid,
        run_id: runId,
        status: "failed",
        row_count: 0,
        error: message.slice(0, 500),
        scraped_at: new Date().toISOString(),
      });
    }
  }

  // Coordinate enrichment: top up peaks that still have no lat/lon by reading
  // their Peakbagger peak page (the only source of record for peak facts).
  const coordLimit = Math.min(
    Math.max(Number(url.searchParams.get("coords") ?? 25) || 0, 0),
    60,
  );
  let coordsAdded = 0;
  if (coordLimit > 0) {
    const { parsePeakCoords } = await import("@/lib/peakbagger-list-parse");
    const { data: missing } = await supabaseAdmin
      .from("peakbagger_peaks")
      .select("pid")
      .is("lat", null)
      .order("coords_checked_at", { ascending: true, nullsFirst: true })
      .limit(coordLimit);

    for (const row of missing ?? []) {
      try {
        const page = await fetchPeakbagger(`https://peakbagger.com/peak.aspx?pid=${row.pid}`);
        const coords = page.blocked ? null : parsePeakCoords(page.markdown ?? "");
        await supabaseAdmin
          .from("peakbagger_peaks")
          .update({
            ...(coords ? { lat: coords.lat, lon: coords.lon, coords_source: "peakbagger" } : {}),
            coords_checked_at: new Date().toISOString(),
          })
          .eq("pid", row.pid);
        if (coords) coordsAdded++;
      } catch (err) {
        await log("error", `coords pid ${row.pid}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (missing?.length) await log("info", `coords: ${coordsAdded}/${missing.length} peaks located`);
  }

  const summary = `daily scrape: ${queue.length} lists, ${peaks} peaks seen, ${inserted} new, ${blocked} blocked, ${coordsAdded} coords`;
  await log("info", summary);
  if (runId) {
    await supabaseAdmin
      .from("peakbagger_import_runs")
      .update({
        status: "completed",
        lists_done: queue.length - blocked,
        lists_blocked: blocked,
        peaks_captured: peaks,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return json({ ok: true, lists: queue.length, peaks, inserted, blocked, coordsAdded, runId });
};

export const Route = createFileRoute("/api/public/hooks/scrape-peakbagger")({
  server: { handlers: { POST: handler, GET: handler } },
});
