import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Youtube, CheckCircle2, XCircle, Clock, RefreshCw, Mountain, ExternalLink, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import { ascentLinkForCountry } from "@/lib/peak-match";

type YoutubeClimb = {
  id: string;
  video_id: string;
  video_title: string;
  video_description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  published_at: string | null;
  peak_name: string | null;
  country: string | null;
  continent: string | null;
  elevation: string | null;
  climb_date: string | null;
  status: string;
  created_at: string;
};

type FilterStatus = "all" | "pending" | "confirmed" | "rejected";

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  confirmed: CheckCircle2,
  rejected: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-500",
  confirmed: "text-ice",
  rejected: "text-destructive",
};

export default function LatestClimbs() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const queryClient = useQueryClient();

  const { data: climbs = [], isLoading, error } = useQuery({
    queryKey: ["youtube-climbs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_climbs")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as YoutubeClimb[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-youtube-climbs");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Sync complete!");
      queryClient.invalidateQueries({ queryKey: ["youtube-climbs"] });
    },
    onError: (err) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  const filtered = filter === "all" ? climbs : climbs.filter((c) => c.status === filter);
  const pendingCount = climbs.filter((c) => c.status === "pending").length;
  const confirmedCount = climbs.filter((c) => c.status === "confirmed").length;

  const videoSchema = climbs
    .filter((c) => c.status === "confirmed")
    .slice(0, 25)
    .map((c) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: c.video_title,
      description:
        c.video_description?.slice(0, 300) ||
        `Summit video${c.peak_name ? ` from ${c.peak_name}` : ""}${c.country ? `, ${c.country}` : ""} by Onsight Martin.`,
      thumbnailUrl: c.thumbnail_url ? [c.thumbnail_url] : undefined,
      uploadDate: c.published_at || undefined,
      contentUrl: c.video_url,
      embedUrl: `https://www.youtube.com/embed/${c.video_id}`,
      publisher: {
        "@type": "Organization",
        name: "Onsight Martin",
      },
    }));

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Latest Climbs — Summit Videos & Trip Reports"
        description="Watch the newest summit videos from Martin Gårdling's mission to climb the highest mountain of every country — routes, conditions and full trip reports."
        path="/latest"
        jsonLd={videoSchema}
      />
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Latest from YouTube
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Auto-detected climbs from the{" "}
              <a
                href="https://www.youtube.com/@onsightmartin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Onsight Martin
              </a>{" "}
              YouTube channel, analyzed by AI.
            </p>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-sm font-display tracking-wider text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Now"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-foreground">{climbs.length}</p>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Total Videos</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-ice">{confirmedCount}</p>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Confirmed Climbs</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-muted-foreground text-xs tracking-wider uppercase">Pending Review</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "confirmed", "rejected"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-sm text-sm font-display tracking-wider transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {" "}
              ({s === "all" ? climbs.length : climbs.filter((c) => c.status === s).length})
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-destructive">
            Error loading data. Make sure Cloud is configured.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No videos found. Click "Sync Now" to fetch latest videos from YouTube.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((climb) => {
              const StatusIcon = statusIcons[climb.status] || Clock;
              const statusColor = statusColors[climb.status] || "text-muted-foreground";

              return (
                <div
                  key={climb.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <a href={climb.video_url} target="_blank" rel="noopener noreferrer" className="block relative group">
                    {climb.thumbnail_url ? (
                      <img
                        src={climb.thumbnail_url}
                        alt={`Video thumbnail: ${climb.video_title}`}
                        className="w-full aspect-video object-cover"
                        width={480}
                        height={270}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-secondary flex items-center justify-center">
                        <Youtube className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Youtube className="w-10 h-10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </a>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${statusColor}`} />
                      <h2 className="font-display text-sm font-bold text-foreground line-clamp-2">
                        {climb.video_title}
                      </h2>
                    </div>

                    {climb.peak_name && (
                      <div className="bg-secondary rounded-sm p-2 mb-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Mountain className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-medium text-foreground">{climb.peak_name}</span>
                        </div>
                        {climb.country && (
                          <p className="text-xs text-muted-foreground">{climb.country} · {climb.continent}</p>
                        )}
                        {climb.elevation && (
                          <p className="text-xs text-muted-foreground">{climb.elevation}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {climb.published_at
                          ? new Date(climb.published_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                      <div className="flex items-center gap-3">
                        {climb.country && (
                          <Link
                            to={`/peak/${slugify(climb.country)}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            Peak page <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {ascentLinkForCountry(climb.country) && (
                          <Link
                            to={ascentLinkForCountry(climb.country)!}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mountain className="w-3 h-3" /> Match me
                          </Link>
                        )}
                        <a
                          href={climb.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Watch <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Onsight Martin — Martin Gårdling</p>
        </div>
      </footer>
    </div>
  );
}
