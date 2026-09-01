import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Lock, AlertTriangle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";
import { peakbaggerImportStatus } from "@/lib/import-status.functions";

interface Run {
  id: string;
  status: string;
  lists_total: number;
  lists_done: number;
  lists_blocked: number;
  peaks_captured: number;
  batches_total: number;
  batches_applied: number;
  rows_upserted: number;
  last_error: string | null;
  started_at: string;
  finished_at: string | null;
  updated_at: string;
}

interface Event {
  id: string;
  run_id: string | null;
  level: string;
  scope: string | null;
  message: string;
  created_at: string;
}

const pct = (done: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border bg-card/60 p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
  </div>
);

/** Admin-only dashboard: progress and errors of the Peakbagger import pipeline. */
const PeakbaggerImportPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const fetchStatus = useServerFn(peakbaggerImportStatus);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["peakbagger-import-status"],
    queryFn: () => fetchStatus(),
    enabled: Boolean(user && isAdmin),
    refetchInterval: 30_000,
  });

  const runs = (data?.runs ?? []) as Run[];
  const events = (data?.events ?? []) as Event[];
  const current = runs[0];
  const errors = events.filter((e) => e.level === "error");

  if (!loading && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Lock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Admins only</h1>
          <p className="mt-2 text-muted-foreground">
            This dashboard shows internal import diagnostics.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Peakbagger import status — Onsight Martin"
        description="Private dashboard for the Peakbagger reference import."
        noindex
      />
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Database className="h-6 w-6 text-primary" />
            Peakbagger import
          </h1>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}

        {!isLoading && !current && (
          <p className="text-muted-foreground">
            No import run has been recorded yet. Runs appear here once the scrape/load pipeline
            reports progress.
          </p>
        )}

        {current && (
          <section className="space-y-5">
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  Started {when(current.started_at)} · updated {when(current.updated_at)}
                </span>
                <span className="rounded-full border border-border px-3 py-0.5 text-xs uppercase tracking-wide text-foreground">
                  {current.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm text-foreground">
                  <span>
                    Lists {current.lists_done} / {current.lists_total}
                  </span>
                  <span>{pct(current.lists_done, current.lists_total)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct(current.lists_done, current.lists_total)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Peaks captured" value={current.peaks_captured.toLocaleString()} />
              <Stat
                label="Batches applied"
                value={`${current.batches_applied} / ${current.batches_total}`}
              />
              <Stat label="Rows upserted" value={current.rows_upserted.toLocaleString()} />
              <Stat label="Lists blocked" value={current.lists_blocked} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Stat
                label="Reference table rows (peakbagger_peaks)"
                value={(data?.referenceRows ?? 0).toLocaleString()}
              />
              <Stat
                label="Lists scraped (resume checkpoint)"
                value={(data?.listsScraped ?? 0).toLocaleString()}
              />
              <Stat
                label="Lists to retry"
                value={(data?.listsUnfinished ?? 0).toLocaleString()}
              />
            </div>

            {current.last_error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Last error
                </div>
                <p className="mt-1 break-words text-sm text-foreground">{current.last_error}</p>
              </div>
            )}
          </section>
        )}

        {(data?.batches?.length ?? 0) > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Batches ({data!.batches.filter((b) => b.status === "applied").length} applied of{" "}
              {data!.batches.length})
            </h2>
            <ul className="space-y-1 text-sm">
              {data!.batches.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-3 border-b border-border/60 py-1.5"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                    #{String(b.batch_no).padStart(3, "0")}
                  </span>
                  <span
                    className={
                      b.status === "applied"
                        ? "text-primary"
                        : b.status === "failed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {b.status}
                  </span>
                  <span className="text-foreground/80">{b.row_count.toLocaleString()} rows</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {b.checksum.slice(0, 10)}
                  </span>
                  {b.applied_at && (
                    <span className="text-xs text-muted-foreground">{when(b.applied_at)}</span>
                  )}
                  {b.error && <span className="w-full break-words text-destructive">{b.error}</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Batches are fingerprinted by content — a re-run skips every checksum already marked
              applied and only executes the missing ones.
            </p>
          </section>
        )}

        {errors.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Errors ({errors.length})
            </h2>
            <ul className="space-y-2">
              {errors.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-destructive/30 bg-card/60 p-3 text-sm"
                >
                  <div className="text-xs text-muted-foreground">
                    {when(e.created_at)}
                    {e.scope ? ` · ${e.scope}` : ""}
                  </div>
                  <div className="mt-1 break-words text-foreground">{e.message}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Recent activity</h2>
            <ul className="space-y-1 text-sm">
              {events.slice(0, 50).map((e) => (
                <li key={e.id} className="flex gap-3 border-b border-border/60 py-1.5">
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {when(e.created_at)}
                  </span>
                  <span
                    className={
                      e.level === "error" ? "text-destructive" : "text-foreground/80"
                    }
                  >
                    {e.scope ? `[${e.scope}] ` : ""}
                    {e.message}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {runs.length > 1 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Previous runs</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {runs.slice(1).map((r) => (
                <li key={r.id} className="border-b border-border/60 py-1.5">
                  {when(r.started_at)} — {r.status} · lists {r.lists_done}/{r.lists_total} · rows{" "}
                  {r.rows_upserted.toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default PeakbaggerImportPage;
