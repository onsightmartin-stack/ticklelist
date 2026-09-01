import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { ShieldCheck, Upload } from "lucide-react";
import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { reasonLabel, useModeration, type ReportStatus } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

const FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];

const when = (iso: string) => new Date(iso).toLocaleString();

/** Admin-only moderation queue for reported posts and comments. */
const ModerationPage = () => {
  const { user, isAdmin } = useAuth();
  const { profiles } = useCommunityData();
  const { reports, content, loading, setStatus, removeContent } = useModeration();
  const [filter, setFilter] = useState<ReportStatus | "all">("open");

  const name = (id: string | null) => (id ? profiles[id]?.display_name ?? "Climber" : "—");
  const shown = reports.filter((r) => filter === "all" || r.status === filter);

  if (!user || !isAdmin) {
    return (
      <CommunityLayout>
        <Seo title="Moderation — Ticklelist" description="Moderator tools for the Ticklelist community." path="/community/moderation" noindex />
        <MembersOnly
          title="Moderators only"
          description="This page is reserved for Ticklelist moderators."
        />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo title="Moderation — Ticklelist" description="Review reported posts and comments." path="/community/moderation" noindex />

      <header className="mb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Ticklelist</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary" /> Moderation
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Reports filed by members. Review, dismiss, or remove the content.
        </p>
        <Link
          to="/community/import-peaks"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline"
        >
          <Upload className="w-3.5 h-3.5" /> Bulk peak import
        </Link>
      </header>


      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1 text-[11px] opacity-70">
                {reports.filter((r) => r.status === f.value).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here — the community is behaving. 🏔️</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const item =
              r.target_type === "post" ? content.posts[r.target_id] : content.comments[r.target_id];
            const gone = !item;
            const postId = r.target_type === "post" ? r.target_id : content.comments[r.target_id]?.post_id;
            return (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 uppercase tracking-wider text-[10px]",
                      r.status === "open" ? "border-destructive text-destructive" : "border-border",
                    )}
                  >
                    {r.status}
                  </span>
                  <span className="uppercase tracking-wider text-[10px]">{r.target_type}</span>
                  <span>· {reasonLabel(r.reason)}</span>
                  <span>· reported by {name(r.reporter_id)}</span>
                  <span>· {when(r.created_at)}</span>
                </div>

                {r.details && <p className="mt-2 text-sm italic break-words">“{r.details}”</p>}

                <div className="mt-3 rounded-md border border-border bg-background/50 p-3 text-sm">
                  {gone ? (
                    <p className="text-muted-foreground">Content no longer exists.</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">by {name(item.user_id)}</p>
                      <p className="whitespace-pre-line break-words">{item.body || "(no text)"}</p>
                      {"media_url" in item && item.media_url && item.media_type === "image" && (
                        <img src={item.media_url} alt="Reported attachment" className="mt-2 max-h-48 rounded border border-border" />
                      )}
                      {postId && (
                        <Link to={`/community/wall#post-${postId}`} className="mt-2 inline-block text-xs text-primary underline">
                          Open on the Wall
                        </Link>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!gone && (
                    <Button size="sm" variant="destructive" onClick={() => removeContent(r)}>
                      Remove content
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setStatus(r, "reviewed")}>
                    Mark reviewed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r, "dismissed")}>
                    Dismiss
                  </Button>
                  {r.status !== "open" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(r, "open")}>
                      Reopen
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CommunityLayout>
  );
};

export default ModerationPage;
