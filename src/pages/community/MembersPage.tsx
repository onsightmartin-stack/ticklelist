import { fuzzyRank } from "@/lib/fuzzy";
import { useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { Search } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import MemberAvatar from "@/components/community/MemberAvatar";
import FollowButton from "@/components/community/FollowButton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { useFollows } from "@/hooks/useFollows";
import { rankFor } from "@/lib/badges";

const MembersPage = () => {
  const { user } = useAuth();
  const { profiles, ascents, fetching } = useCommunityData();
  const { following, followerCounts, toggleFollow } = useFollows();
  const [query, setQuery] = useState("");

  const members = useMemo(() => {
    const counts: Record<string, number> = {};
    ascents.forEach((a) => { counts[a.user_id] = (counts[a.user_id] ?? 0) + 1; });
    return fuzzyRank(Object.values(profiles), query, (p) => [p.display_name, p.country])
      .map((p) => ({ ...p, ascentCount: counts[p.id] ?? 0 }))
      .sort((a, b) => b.ascentCount - a.ascentCount || a.display_name.localeCompare(b.display_name));
  }, [profiles, ascents, query]);

  if (!user) {
    return (
      <CommunityLayout>
      <Seo
        title="Find Climbers — Ticklelist Members"
        description="Search Ticklelist members, follow climbers you like and see the peaks they have logged."
        noindex
      />
        <MembersOnly title="Member directory is members only" description="Sign in to find climbers, follow them and see their logged ascents." />
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <Seo
        title="Find Climbers — Ticklelist Members"
        description="Search Ticklelist members, follow climbers you like and see the peaks they have logged."
        noindex
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl tracking-wider">Members</h1>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or country"
            className="pl-9"
            aria-label="Search members"
          />
        </div>
      </div>

      {fetching ? (
        <p className="text-muted-foreground text-sm">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground text-sm">No members match that search.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {members.map((m) => (
            <li key={m.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
              <Link to={`/community/members/${m.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <MemberAvatar path={m.avatar_url} name={m.display_name} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="font-display tracking-wider truncate">{m.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rankFor(m.ascentCount).current.name} · {m.ascentCount} ascent{m.ascentCount === 1 ? "" : "s"}
                    {m.country ? ` · ${m.country}` : ""}
                  </p>
                </div>
              </Link>
              {user && user.id !== m.id && (
                <FollowButton
                  isFollowing={following.has(m.id)}
                  followerCount={followerCounts[m.id]}
                  onToggle={() => toggleFollow(m.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </CommunityLayout>
  );
};

export default MembersPage;
