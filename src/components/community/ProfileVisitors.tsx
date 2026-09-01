import { useEffect, useRef } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Link } from "@/lib/router-compat";
import MemberAvatar from "./MemberAvatar";
import { timeAgo } from "@/lib/time-ago";
import type { ProfileVisit } from "@/hooks/useProfileViews";
import type { PublicProfile } from "@/lib/community";

interface ProfileVisitorsProps {
  visits: ProfileVisit[];
  profiles: Record<string, PublicProfile | undefined>;
  className?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

/** "Who viewed your profile" — only ever rendered for the profile owner. */
const ProfileVisitors = ({
  visits,
  profiles,
  className,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ProfileVisitorsProps) => {
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || !onLoadMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, visits.length]);

  return (
  <section className={`rounded-lg border border-border bg-card p-5 ${className ?? ""}`}>
    <h2 className="font-display tracking-wider text-lg flex items-center gap-2">
      <Eye className="w-4 h-4 text-primary" /> Recent profile visitors
    </h2>
    <p className="text-xs text-muted-foreground mt-1">Only you can see this list.</p>
    {visits.length === 0 ? (
      <p className="text-sm text-muted-foreground mt-3">No visits yet — log an ascent and get on the feed.</p>
    ) : (
      <ul className="mt-4 flex flex-wrap gap-4">
        {visits.map((v) => {
          const p = profiles[v.viewer_id];
          const name = p?.display_name ?? "Member";
          return (
            <li key={v.viewer_id}>
              <Link
                to={`/community/members/${v.viewer_id}`}
                className="flex w-24 flex-col items-center gap-1 text-center hover:opacity-80"
              >
                <MemberAvatar path={p?.avatar_url ?? null} name={name} className="h-12 w-12" />
                <span className="text-xs truncate w-full">{name}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(v.updated_at)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    )}
    {hasMore && (
      <div ref={sentinel} className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 disabled:opacity-60"
        >
          {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
          {loadingMore ? "Loading…" : "Show older visitors"}
        </button>
      </div>
    )}
  </section>
  );
};

export default ProfileVisitors;
