import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Youtube, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";
import { outboundClickRows } from "@/lib/click-track.functions";

interface Row {
  kind: string;
  url: string;
  video_id: string | null;
  label: string | null;
  page_path: string | null;
  created_at: string;
}

const KIND_LABEL: Record<string, string> = {
  youtube_video: "Video links",
  youtube_channel: "Channel / subscribe",
  youtube_search: "YouTube search",
};

const dayKey = (iso: string) => iso.slice(0, 10);
const since = (days: number) => Date.now() - days * 86_400_000;

const tally = <T,>(rows: T[], key: (r: T) => string | null) => {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

/** Admin-only dashboard: how often visitors click through to YouTube. */
const YouTubeStatsPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const fetchRows = useServerFn(outboundClickRows);

  const { data, isLoading } = useQuery({
    queryKey: ["outbound-clicks"],
    queryFn: () => fetchRows(),
    enabled: Boolean(user && isAdmin),
  });

  const rows = (data?.rows ?? []) as Row[];

  const stats = useMemo(() => {
    const yt = rows.filter((r) => r.kind.startsWith("youtube"));
    const last7 = yt.filter((r) => new Date(r.created_at).getTime() > since(7));
    const last30 = yt.filter((r) => new Date(r.created_at).getTime() > since(30));
    const days = tally(last30, (r) => dayKey(r.created_at)).sort((a, b) =>
      a[0] < b[0] ? -1 : 1,
    );
    return {
      total: yt.length,
      last7: last7.length,
      last30: last30.length,
      byKind: tally(yt, (r) => r.kind),
      byVideo: tally(
        yt.filter((r) => r.kind === "youtube_video"),
        (r) => r.label || r.video_id || r.url,
      ).slice(0, 20),
      byPage: tally(yt, (r) => r.page_path).slice(0, 15),
      days,
      recent: yt.slice(0, 25),
    };
  }, [rows]);

  const peakDay = Math.max(1, ...stats.days.map(([, n]) => n));

  if (!loading && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <Seo title="YouTube stats" description="Private dashboard." path="/admin/youtube-stats" noindex />
        <Navbar />
        <div className="container mx-auto px-4 py-24 max-w-md text-center">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">Private</h1>
          <p className="text-muted-foreground mt-2">This dashboard is only visible to Martin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title="YouTube stats" description="Private dashboard." path="/admin/youtube-stats" noindex />
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> YouTube link stats
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Clicks from onsightmartin.com and Ticklelist out to YouTube — video links, subscribe
          buttons and search links. Tracking started today, so numbers build up from now on.
        </p>

        {isLoading ? (
          <p className="text-muted-foreground mt-8">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                ["All time", stats.total],
                ["Last 30 days", stats.last30],
                ["Last 7 days", stats.last7],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="font-display text-2xl font-bold text-foreground mt-1">{value}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 bg-card border border-border rounded-lg p-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">By link type</h2>
              {stats.byKind.length === 0 && <p className="text-sm text-muted-foreground">No clicks yet.</p>}
              {stats.byKind.map(([kind, n]) => (
                <div key={kind} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{KIND_LABEL[kind] ?? kind}</span>
                  <span className="text-foreground font-medium">{n}</span>
                </div>
              ))}
            </section>

            <section className="mt-6 bg-card border border-border rounded-lg p-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" /> Top videos
              </h2>
              {stats.byVideo.length === 0 && <p className="text-sm text-muted-foreground">No video clicks yet.</p>}
              {stats.byVideo.map(([label, n]) => (
                <div key={label} className="flex justify-between gap-4 text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground truncate">{label}</span>
                  <span className="text-foreground font-medium shrink-0">{n}</span>
                </div>
              ))}
            </section>

            <section className="mt-6 bg-card border border-border rounded-lg p-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Where they clicked</h2>
              {stats.byPage.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
              {stats.byPage.map(([path, n]) => (
                <div key={path} className="flex justify-between gap-4 text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground truncate">{path}</span>
                  <span className="text-foreground font-medium shrink-0">{n}</span>
                </div>
              ))}
            </section>

            <section className="mt-6 bg-card border border-border rounded-lg p-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Last 30 days</h2>
              {stats.days.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clicks yet.</p>
              ) : (
                <div className="flex items-end gap-1 h-28">
                  {stats.days.map(([day, n]) => (
                    <div key={day} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${(n / peakDay) * 100}%` }} title={`${day}: ${n}`} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 bg-card border border-border rounded-lg p-5">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Recent clicks</h2>
              {stats.recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
              {stats.recent.map((r, i) => (
                <div key={i} className="text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>{" "}
                  <span className="text-foreground">{r.label || r.url}</span>{" "}
                  <span className="text-muted-foreground text-xs">({KIND_LABEL[r.kind] ?? r.kind}{r.page_path ? ` · ${r.page_path}` : ""})</span>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default YouTubeStatsPage;
